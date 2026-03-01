import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { resolveUser } from "../auth/resolve-user";
import { db } from "../db";
import { validateWorkflowIntegrations } from "../db/integrations";
import { apiKeys, workflowExecutionLogs, workflowExecutions, workflows } from "../db/schema";
import { generateId } from "../lib/utils/id";
import {
  buildWorkflowUpdateData,
  corsHeaders,
  executeWorkflowBackground,
  sanitizeNodesForPublicView,
  WorkflowEdgeLike,
  WorkflowNodeLike,
} from "./utils";

export async function handleExecuteWorkflow(request: Request, workflowId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (workflow.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    type WorkflowNode = {
      id: string;
      type?: string;
      data: { type?: string; config?: Record<string, unknown>; [k: string]: unknown };
      [k: string]: unknown
    }
    type WorkflowEdge = { id: string; source: string; target: string; [k: string]: unknown }

    const validation = await validateWorkflowIntegrations(
      workflow.nodes as WorkflowNode[],
      user.id,
    );
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Workflow contains invalid integration references" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const input = body.input || {};

    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        userId: user.id,
        status: "running",
        input,
      })
      .returning();

    // Execute workflow in background (no await)
    executeWorkflowBackground(
      execution.id,
      workflowId,
      workflow.nodes as WorkflowNode[],
      workflow.edges as WorkflowEdge[],
      input,
    );

    return NextResponse.json({ executionId: execution.id, status: "running" });
  } catch (error) {
    console.error("Failed to start workflow execution:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute workflow" },
      { status: 500 },
    );
  }
}

export async function handleGetWorkflow(request: Request, workflowId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const isOwner = user?.id === workflow.userId;

    if (!isOwner && workflow.visibility !== "public") {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...workflow,
      nodes: isOwner
        ? workflow.nodes
        : sanitizeNodesForPublicView(workflow.nodes as Record<string, unknown>[]),
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
      isOwner,
    });
  } catch (error) {
    console.error("Failed to get workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get workflow" },
      { status: 500 },
    );
  }
}

export async function handleGetWorkflows(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json([], { status: 200 });

    const userWorkflows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, user.id))
      .orderBy(desc(workflows.updatedAt));

    return NextResponse.json(
      userWorkflows.map((w) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("Failed to get workflows:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get workflows" },
      { status: 500 },
    );
  }
}

export async function handleCreateWorkflow(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!(body.name && body.nodes && body.edges)) {
      return NextResponse.json(
        { error: "Name, nodes, and edges are required" },
        { status: 400 },
      );
    }

    const validation = await validateWorkflowIntegrations(body.nodes, user.id);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid integration references in workflow" },
        { status: 403 },
      );
    }

    let nodes = body.nodes;
    if (nodes.length === 0) {
      nodes = [
        {
          id: generateId(),
          type: "trigger",
          position: { x: 0, y: 0 },
          data: {
            label: "",
            description: "",
            type: "trigger",
            config: { triggerType: "Manual" },
            status: "idle",
          },
        },
      ];
    }

    let workflowName = body.name;
    if (body.name === "Untitled Workflow") {
      const userWorkflows = await db.query.workflows.findMany({
        where: eq(workflows.userId, user.id),
      });
      workflowName = `Untitled ${ userWorkflows.length + 1 }`;
    }

    const workflowId = generateId();
    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        id: workflowId,
        name: workflowName,
        description: body.description,
        nodes,
        edges: body.edges,
        userId: user.id,
      })
      .returning();

    return NextResponse.json({
      ...newWorkflow,
      createdAt: newWorkflow.createdAt.toISOString(),
      updatedAt: newWorkflow.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create workflow" },
      { status: 500 },
    );
  }
}

const CURRENT_WORKFLOW_NAME = "~~__CURRENT__~~";

export async function handleGetCurrentWorkflow(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [currentWorkflow] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.name, CURRENT_WORKFLOW_NAME), eq(workflows.userId, user.id)))
      .orderBy(desc(workflows.updatedAt))
      .limit(1);

    if (!currentWorkflow) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    return NextResponse.json({
      id: currentWorkflow.id,
      nodes: currentWorkflow.nodes,
      edges: currentWorkflow.edges,
    });
  } catch (error) {
    console.error("Failed to get current workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get current workflow" },
      { status: 500 },
    );
  }
}

export async function handleSaveCurrentWorkflow(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { nodes, edges } = body;

    if (!(nodes && edges)) {
      return NextResponse.json({ error: "Nodes and edges are required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.name, CURRENT_WORKFLOW_NAME), eq(workflows.userId, user.id)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(workflows)
        .set({ nodes, edges, updatedAt: new Date() })
        .where(eq(workflows.id, existing.id))
        .returning();

      return NextResponse.json({ id: updated.id, nodes: updated.nodes, edges: updated.edges });
    }

    const workflowId = generateId();
    const [saved] = await db
      .insert(workflows)
      .values({
        id: workflowId,
        name: CURRENT_WORKFLOW_NAME,
        description: "Auto-saved current workflow",
        nodes,
        edges,
        userId: user.id,
      })
      .returning();

    return NextResponse.json({ id: saved.id, nodes: saved.nodes, edges: saved.edges });
  } catch (error) {
    console.error("Failed to save current workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save current workflow" },
      { status: 500 },
    );
  }
}

export async function handleGetExecutionStatus(request: Request, executionId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const execution = await db.query.workflowExecutions.findFirst({
      where: eq(workflowExecutions.id, executionId),
      with: { workflow: true },
    });

    if (!execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    if (execution.workflow.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await db.query.workflowExecutionLogs.findMany({
      where: eq(workflowExecutionLogs.executionId, executionId),
    });

    const nodeStatuses = logs.map((log) => ({
      nodeId: log.nodeId,
      status: log.status,
    }));

    return NextResponse.json({ status: execution.status, nodeStatuses });
  } catch (error) {
    console.error("Failed to get execution status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get execution status" },
      { status: 500 },
    );
  }
}

export async function handleGetExecutionLogs(request: Request, executionId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const execution = await db.query.workflowExecutions.findFirst({
      where: eq(workflowExecutions.id, executionId),
      with: { workflow: true },
    });

    if (!execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    if (execution.workflow.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await db.query.workflowExecutionLogs.findMany({
      where: eq(workflowExecutionLogs.executionId, executionId),
      orderBy: [desc(workflowExecutionLogs.timestamp)],
    });

    return NextResponse.json({ execution, logs });
  } catch (error) {
    console.error("Failed to get execution logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get execution logs" },
      { status: 500 },
    );
  }
}

export async function handlePatchWorkflow(request: Request, workflowId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingWorkflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, workflowId), eq(workflows.userId, user.id)),
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const body = await request.json();

    if (Array.isArray(body.nodes)) {
      const validation = await validateWorkflowIntegrations(body.nodes, user.id);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid integration references in workflow" },
          { status: 403 },
        );
      }
    }

    if (
      body.visibility !== undefined &&
      body.visibility !== "private" &&
      body.visibility !== "public"
    ) {
      return NextResponse.json(
        { error: "Invalid visibility value. Must be 'private' or 'public'" },
        { status: 400 },
      );
    }

    const updateData = buildWorkflowUpdateData(body);
    const [updatedWorkflow] = await db
      .update(workflows)
      .set(updateData)
      .where(eq(workflows.id, workflowId))
      .returning();

    if (!updatedWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updatedWorkflow,
      createdAt: updatedWorkflow.createdAt.toISOString(),
      updatedAt: updatedWorkflow.updatedAt.toISOString(),
      isOwner: true,
    });
  } catch (error) {
    console.error("Failed to update workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update workflow" },
      { status: 500 },
    );
  }
}

export async function handleDeleteWorkflow(request: Request, workflowId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingWorkflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, workflowId), eq(workflows.userId, user.id)),
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    await db.delete(workflows).where(eq(workflows.id, workflowId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete workflow" },
      { status: 500 },
    );
  }
}

export async function handleDuplicateWorkflow(request: Request, workflowId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sourceWorkflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!sourceWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const isOwner = user.id === sourceWorkflow.userId;
    if (!isOwner && sourceWorkflow.visibility !== "public") {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    type NodeLike = {
      id: string;
      data?: { config?: { integrationId?: string; [k: string]: unknown }; status?: string; [k: string]: unknown };
      [k: string]: unknown
    }
    type EdgeLike = { id: string; source: string; target: string; [k: string]: unknown }

    const oldNodes = sourceWorkflow.nodes as NodeLike[];
    const newNodes = oldNodes.map((node) => {
      const newNode: NodeLike = { ...node, id: generateId() };
      if (newNode.data) {
        const data = { ...newNode.data };
        if (data.config) {
          const { integrationId: _, ...configWithout } = data.config;
          data.config = configWithout;
        }
        data.status = "idle";
        newNode.data = data;
      }
      return newNode;
    });

    const idMap = new Map(oldNodes.map((n, i) => [n.id, newNodes[i].id]));
    const newEdges = (sourceWorkflow.edges as EdgeLike[]).map((edge) => ({
      ...edge,
      id: generateId(),
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }));

    const userWorkflows = await db.query.workflows.findMany({
      where: eq(workflows.userId, user.id),
    });

    const baseName = `${ sourceWorkflow.name } (Copy)`;
    let workflowName = baseName;
    const existingNames = new Set(userWorkflows.map((w) => w.name));

    if (existingNames.has(workflowName)) {
      let counter = 2;
      while (existingNames.has(`${ baseName } ${ counter }`)) counter++;
      workflowName = `${ baseName } ${ counter }`;
    }

    const newWorkflowId = generateId();
    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        id: newWorkflowId,
        name: workflowName,
        description: sourceWorkflow.description,
        nodes: newNodes,
        edges: newEdges,
        userId: user.id,
        visibility: "private",
      })
      .returning();

    return NextResponse.json({
      ...newWorkflow,
      createdAt: newWorkflow.createdAt.toISOString(),
      updatedAt: newWorkflow.updatedAt.toISOString(),
      isOwner: true,
    });
  } catch (error) {
    console.error("Failed to duplicate workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate workflow" },
      { status: 500 },
    );
  }
}

export async function handleGetWorkflowExecutions(request: Request, workflowId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, workflowId), eq(workflows.userId, user.id)),
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const executions = await db.query.workflowExecutions.findMany({
      where: eq(workflowExecutions.workflowId, workflowId),
      orderBy: [desc(workflowExecutions.startedAt)],
      limit: 50,
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("Failed to get executions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get executions" },
      { status: 500 },
    );
  }
}

export async function handleDeleteWorkflowExecutions(request: Request, workflowId: string): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, workflowId), eq(workflows.userId, user.id)),
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const execList = await db.query.workflowExecutions.findMany({
      where: eq(workflowExecutions.workflowId, workflowId),
      columns: { id: true },
    });

    const executionIds = execList.map((e) => e.id);

    if (executionIds.length > 0) {
      await db
        .delete(workflowExecutionLogs)
        .where(inArray(workflowExecutionLogs.executionId, executionIds));

      await db
        .delete(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, workflowId));
    }

    return NextResponse.json({ success: true, deletedCount: executionIds.length });
  } catch (error) {
    console.error("Failed to delete executions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete executions" },
      { status: 500 },
    );
  }
}

export async function handleWebhookWorkflow(request: Request, workflowId: string): Promise<Response> {
  try {
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401, headers: corsHeaders },
      );
    }

    const key = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!key?.startsWith("wfb_")) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 401, headers: corsHeaders },
      );
    }

    const keyHash = createHash("sha256").update(key).digest("hex");
    const apiKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
    });

    if (!apiKey || apiKey.userId !== workflow.userId) {
      return NextResponse.json(
        { error: "Invalid API key or insufficient permissions" },
        { status: 401, headers: corsHeaders },
      );
    }

    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .catch(() => {
      });

    type WorkflowNode = WorkflowNodeLike
    const triggerNode = (workflow.nodes as WorkflowNode[]).find(
      (node) => node.data.type === "trigger",
    );

    if (!triggerNode || triggerNode.data.config?.triggerType !== "Webhook") {
      return NextResponse.json(
        { error: "This workflow is not configured for webhook triggers" },
        { status: 400, headers: corsHeaders },
      );
    }

    const validation = await validateWorkflowIntegrations(
      workflow.nodes as WorkflowNode[],
      workflow.userId,
    );
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Workflow contains invalid integration references" },
        { status: 403, headers: corsHeaders },
      );
    }

    const body = await request.json().catch(() => ({}));
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        userId: workflow.userId,
        status: "running",
        input: body,
      })
      .returning();

    executeWorkflowBackground(
      execution.id,
      workflowId,
      workflow.nodes as WorkflowNodeLike[],
      workflow.edges as WorkflowEdgeLike[],
      body,
    );

    return NextResponse.json(
      { executionId: execution.id, status: "running" },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Failed to start webhook execution:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute workflow" },
      { status: 500, headers: corsHeaders },
    );
  }
}
