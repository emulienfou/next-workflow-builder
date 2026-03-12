import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAllActions, flattenConfigFields } from "../../plugins";
import { db } from "../db";
import { validateWorkflowIntegrations } from "../db/integrations";
import {
  integrations,
  workflows,
  workflowExecutions,
  workflowExecutionLogs,
} from "../db/schema";
import { generateId } from "../lib/utils/id";
import {
  executeWorkflowBackground,
  type WorkflowEdgeLike,
  type WorkflowNodeLike,
} from "../api/utils";

export function registerTools(server: McpServer, userId: string) {
  // ── list_workflows ──────────────────────────────────────────────────
  server.registerTool(
    "list_workflows",
    {
      description: "List the authenticated user's workflows",
      inputSchema: { limit: z.number().optional(), offset: z.number().optional() },
    },
    async ({ limit, offset }) => {
      const rows = await db
        .select()
        .from(workflows)
        .where(eq(workflows.userId, userId))
        .orderBy(desc(workflows.updatedAt))
        .limit(limit ?? 50)
        .offset(offset ?? 0);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(rows.map((w) => ({
              ...w,
              createdAt: w.createdAt.toISOString(),
              updatedAt: w.updatedAt.toISOString(),
            }))),
          },
        ],
      };
    },
  );

  // ── get_workflow ────────────────────────────────────────────────────
  server.registerTool(
    "get_workflow",
    {
      description: "Get a workflow by ID",
      inputSchema: { workflowId: z.string() },
    },
    async ({ workflowId }) => {
      const workflow = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!workflow) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Workflow not found" }) }] };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ...workflow,
              createdAt: workflow.createdAt.toISOString(),
              updatedAt: workflow.updatedAt.toISOString(),
            }),
          },
        ],
      };
    },
  );

  // ── create_workflow ─────────────────────────────────────────────────
  server.registerTool(
    "create_workflow",
    {
      description: "Create a new workflow",
      inputSchema: {
        name: z.string(),
        description: z.string().optional(),
        nodes: z.array(z.record(z.string(), z.unknown())),
        edges: z.array(z.record(z.string(), z.unknown())),
      },
    },
    async ({ name, description, nodes, edges }) => {
      const validation = await validateWorkflowIntegrations(
        nodes as WorkflowNodeLike[],
        userId,
      );
      if (!validation.valid) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Invalid integration references" }),
            },
          ],
        };
      }

      const workflowId = generateId();
      const [created] = await db
        .insert(workflows)
        .values({
          id: workflowId,
          name,
          description,
          nodes,
          edges,
          userId,
        })
        .returning();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ...created,
              createdAt: created.createdAt.toISOString(),
              updatedAt: created.updatedAt.toISOString(),
            }),
          },
        ],
      };
    },
  );

  // ── update_workflow ─────────────────────────────────────────────────
  server.registerTool(
    "update_workflow",
    {
      description: "Update an existing workflow",
      inputSchema: {
        workflowId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        nodes: z.array(z.record(z.string(), z.unknown())).optional(),
        edges: z.array(z.record(z.string(), z.unknown())).optional(),
      },
    },
    async ({ workflowId, name, description, nodes, edges }) => {
      const existing = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Workflow not found" }) }] };
      }

      if (nodes) {
        const validation = await validateWorkflowIntegrations(
          nodes as WorkflowNodeLike[],
          userId,
        );
        if (!validation.valid) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "Invalid integration references" }),
              },
            ],
          };
        }
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (nodes !== undefined) updateData.nodes = nodes;
      if (edges !== undefined) updateData.edges = edges;

      const [updated] = await db
        .update(workflows)
        .set(updateData)
        .where(eq(workflows.id, workflowId))
        .returning();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ...updated,
              createdAt: updated.createdAt.toISOString(),
              updatedAt: updated.updatedAt.toISOString(),
            }),
          },
        ],
      };
    },
  );

  // ── delete_workflow ─────────────────────────────────────────────────
  server.registerTool(
    "delete_workflow",
    {
      description: "Delete a workflow",
      inputSchema: { workflowId: z.string() },
    },
    async ({ workflowId }) => {
      const existing = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Workflow not found" }) }] };
      }

      // Delete execution logs, then executions, then workflow
      const execList = await db.query.workflowExecutions.findMany({
        where: eq(workflowExecutions.workflowId, workflowId),
        columns: { id: true },
      });
      const executionIds = execList.map((e) => e.id);

      if (executionIds.length > 0) {
        await db.delete(workflowExecutionLogs).where(inArray(workflowExecutionLogs.executionId, executionIds));
        await db.delete(workflowExecutions).where(eq(workflowExecutions.workflowId, workflowId));
      }

      await db.delete(workflows).where(eq(workflows.id, workflowId));

      return { content: [{ type: "text" as const, text: JSON.stringify({ success: true }) }] };
    },
  );

  // ── duplicate_workflow ──────────────────────────────────────────────
  server.registerTool(
    "duplicate_workflow",
    {
      description: "Duplicate a workflow",
      inputSchema: { workflowId: z.string() },
    },
    async ({ workflowId }) => {
      const source = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!source) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Workflow not found" }) }] };
      }

      type NodeLike = { id: string; data?: Record<string, unknown>; [k: string]: unknown };
      type EdgeLike = { id: string; source: string; target: string; [k: string]: unknown };

      const oldNodes = source.nodes as NodeLike[];
      const newNodes = oldNodes.map((node) => ({ ...node, id: generateId() }));
      const idMap = new Map(oldNodes.map((n, i) => [n.id, newNodes[i].id]));
      const newEdges = (source.edges as EdgeLike[]).map((edge) => ({
        ...edge,
        id: generateId(),
        source: idMap.get(edge.source) || edge.source,
        target: idMap.get(edge.target) || edge.target,
      }));

      const [created] = await db
        .insert(workflows)
        .values({
          id: generateId(),
          name: `${ source.name } (Copy)`,
          description: source.description,
          nodes: newNodes,
          edges: newEdges,
          userId,
          visibility: "private",
        })
        .returning();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ...created,
              createdAt: created.createdAt.toISOString(),
              updatedAt: created.updatedAt.toISOString(),
            }),
          },
        ],
      };
    },
  );

  // ── execute_workflow ────────────────────────────────────────────────
  server.registerTool(
    "execute_workflow",
    {
      description: "Execute a workflow",
      inputSchema: {
        workflowId: z.string(),
        input: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ workflowId, input }) => {
      const workflow = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!workflow) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Workflow not found" }) }] };
      }

      const validation = await validateWorkflowIntegrations(
        workflow.nodes as WorkflowNodeLike[],
        userId,
      );
      if (!validation.valid) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Invalid integration references" }),
            },
          ],
        };
      }

      const [execution] = await db
        .insert(workflowExecutions)
        .values({
          workflowId,
          userId,
          status: "running",
          input: input ?? {},
        })
        .returning();

      executeWorkflowBackground(
        execution.id,
        workflowId,
        workflow.nodes as WorkflowNodeLike[],
        workflow.edges as WorkflowEdgeLike[],
        input ?? {},
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ executionId: execution.id, status: "running" }),
          },
        ],
      };
    },
  );

  // ── get_execution_status ────────────────────────────────────────────
  server.registerTool(
    "get_execution_status",
    {
      description: "Get execution status and logs",
      inputSchema: { executionId: z.string() },
    },
    async ({ executionId }) => {
      const execution = await db.query.workflowExecutions.findFirst({
        where: eq(workflowExecutions.id, executionId),
        with: { workflow: true },
      });

      if (!execution || execution.workflow.userId !== userId) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Execution not found" }) }] };
      }

      const logs = await db.query.workflowExecutionLogs.findMany({
        where: eq(workflowExecutionLogs.executionId, executionId),
        orderBy: [desc(workflowExecutionLogs.timestamp)],
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              status: execution.status,
              input: execution.input,
              output: execution.output,
              error: execution.error,
              startedAt: execution.startedAt.toISOString(),
              completedAt: execution.completedAt?.toISOString(),
              logs: logs.map((log) => ({
                nodeId: log.nodeId,
                nodeName: log.nodeName,
                nodeType: log.nodeType,
                status: log.status,
                input: log.input,
                output: log.output,
                error: log.error,
              })),
            }),
          },
        ],
      };
    },
  );

  // ── cancel_execution ─────────────────────────────────────────────────
  server.registerTool(
    "cancel_execution",
    {
      description: "Cancel a running workflow execution",
      inputSchema: { executionId: z.string() },
    },
    async ({ executionId }) => {
      const execution = await db.query.workflowExecutions.findFirst({
        where: eq(workflowExecutions.id, executionId),
        with: { workflow: true },
      });

      if (!execution || execution.workflow.userId !== userId) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Execution not found" }) }] };
      }

      if (execution.status !== "running" && execution.status !== "pending") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Execution is not running", status: execution.status }),
            },
          ],
        };
      }

      await db
        .update(workflowExecutions)
        .set({
          status: "cancelled",
          completedAt: new Date(),
          duration: String(Date.now() - new Date(execution.startedAt).getTime()),
        })
        .where(eq(workflowExecutions.id, executionId));

      // Mark pending/running step logs as cancelled
      const runningLogs = await db.query.workflowExecutionLogs.findMany({
        where: and(
          eq(workflowExecutionLogs.executionId, executionId),
          inArray(workflowExecutionLogs.status, ["pending", "running"]),
        ),
      });

      for (const log of runningLogs) {
        await db
          .update(workflowExecutionLogs)
          .set({ status: "error", error: "Cancelled", completedAt: new Date() })
          .where(eq(workflowExecutionLogs.id, log.id));
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: true, status: "cancelled" }) }],
      };
    },
  );

  // ── list_available_actions ──────────────────────────────────────────
  server.registerTool(
    "list_available_actions",
    {
      description: "List all available plugin actions with their config fields",
    },
    async () => {
      const actions = getAllActions();

      const result = actions.map((action) => ({
        id: action.id,
        label: action.label,
        description: action.description,
        category: action.category,
        integration: action.integration,
        configFields: flattenConfigFields(action.configFields).map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
        })),
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    },
  );

  // ── list_integrations ───────────────────────────────────────────────
  server.registerTool(
    "list_integrations",
    {
      description: "List the authenticated user's connected integrations",
    },
    async () => {
      const rows = await db
        .select({
          id: integrations.id,
          name: integrations.name,
          type: integrations.type,
          isManaged: integrations.isManaged,
          createdAt: integrations.createdAt,
          updatedAt: integrations.updatedAt,
        })
        .from(integrations)
        .where(eq(integrations.userId, userId));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(rows.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            }))),
          },
        ],
      };
    },
  );
}
