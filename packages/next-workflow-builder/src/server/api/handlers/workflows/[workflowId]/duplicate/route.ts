import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateId } from "../../../../../../lib/utils/id.js";
import { workflows } from "../../../../../db/schema.js";
import { errorResponse, getOptionalSession, jsonResponse, serializeWorkflow } from "../../../../handler-utils.js";
import type { RouteHandler } from "../../../../types.js";

type WorkflowNodeLike = {
  id: string;
  data?: {
    config?: {
      integrationId?: string;
      [key: string]: unknown;
    };
    status?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type WorkflowEdgeLike = {
  id: string;
  source: string;
  target: string;
  [key: string]: unknown;
};

function stripIntegrationIds(nodes: WorkflowNodeLike[]): WorkflowNodeLike[] {
  return nodes.map((node) => {
    const newNode: WorkflowNodeLike = { ...node, id: nanoid() };
    if (newNode.data) {
      const data = { ...newNode.data };
      if (data.config) {
        const { integrationId: _, ...configWithoutIntegration } = data.config;
        data.config = configWithoutIntegration;
      }
      data.status = "idle";
      newNode.data = data;
    }
    return newNode;
  });
}

function updateEdgeReferences(
  edges: WorkflowEdgeLike[],
  oldNodes: WorkflowNodeLike[],
  newNodes: WorkflowNodeLike[],
): WorkflowEdgeLike[] {
  const idMap = new Map<string, string>();
  oldNodes.forEach((oldNode, index) => {
    idMap.set(oldNode.id, newNodes[index].id);
  });

  return edges.map((edge) => ({
    ...edge,
    id: nanoid(),
    source: idMap.get(edge.source) || edge.source,
    target: idMap.get(edge.target) || edge.target,
  }));
}

export const workflowDuplicate: RouteHandler = async (route, ctx) => {
  try {
    const workflowId = route.segments[1];

    const session = await getOptionalSession(ctx, route.request);
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const sourceWorkflow = await ctx.db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!sourceWorkflow) {
      return errorResponse("Workflow not found", 404);
    }

    const isOwner = session.user.id === sourceWorkflow.userId;

    if (!isOwner && sourceWorkflow.visibility !== "public") {
      return errorResponse("Workflow not found", 404);
    }

    const oldNodes = sourceWorkflow.nodes as WorkflowNodeLike[];
    const newNodes = stripIntegrationIds(oldNodes);
    const newEdges = updateEdgeReferences(
      sourceWorkflow.edges as WorkflowEdgeLike[],
      oldNodes,
      newNodes,
    );

    const userWorkflows = await ctx.db.query.workflows.findMany({
      where: eq(workflows.userId, session.user.id),
    });

    const baseName = `${ sourceWorkflow.name } (Copy)`;
    let workflowName = baseName;
    const existingNames = new Set(userWorkflows.map((w: { name: string }) => w.name));

    if (existingNames.has(workflowName)) {
      let counter = 2;
      while (existingNames.has(`${ baseName } ${ counter }`)) {
        counter += 1;
      }
      workflowName = `${ baseName } ${ counter }`;
    }

    const newWorkflowId = generateId();
    const [newWorkflow] = await ctx.db
      .insert(workflows)
      .values({
        id: newWorkflowId,
        name: workflowName,
        description: sourceWorkflow.description,
        nodes: newNodes,
        edges: newEdges,
        userId: session.user.id,
        visibility: "private",
      })
      .returning();

    return jsonResponse({
      ...serializeWorkflow(newWorkflow),
      isOwner: true,
    });
  } catch (error) {
    console.error("Failed to duplicate workflow:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to duplicate workflow",
      500,
    );
  }
};
