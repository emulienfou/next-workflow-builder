import { eq } from "drizzle-orm";
import { workflows } from "../../../../db/schema.js";
import {
  errorResponse,
  getOptionalSession,
  jsonResponse,
  requireOwnedWorkflow,
  requireSession,
  serializeWorkflow,
} from "../../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../../types.js";

function sanitizeNodesForPublicView(
  nodes: Record<string, unknown>[],
): Record<string, unknown>[] {
  return nodes.map((node) => {
    const sanitizedNode = { ...node };
    if (
      sanitizedNode.data &&
      typeof sanitizedNode.data === "object" &&
      sanitizedNode.data !== null
    ) {
      const data = { ...(sanitizedNode.data as Record<string, unknown>) };
      if (data.config && typeof data.config === "object" && data.config !== null) {
        const { integrationId: _, ...configWithoutIntegration } =
          data.config as Record<string, unknown>;
        data.config = configWithoutIntegration;
      }
      sanitizedNode.data = data;
    }
    return sanitizedNode;
  });
}

function buildUpdateData(body: Record<string, unknown>): Record<string, unknown> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.nodes !== undefined) updateData.nodes = body.nodes;
  if (body.edges !== undefined) updateData.edges = body.edges;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;

  return updateData;
}

export const workflowCrud: RouteHandler = async (route, ctx) => {
  const workflowId = route.segments[1];

  switch (route.method) {
    case "GET":
      return getWorkflow(workflowId, route, ctx);
    case "PATCH":
      return updateWorkflow(workflowId, route, ctx);
    case "DELETE":
      return deleteWorkflow(workflowId, route, ctx);
    default:
      return errorResponse("Method not allowed", 405);
  }
};

async function getWorkflow(
  workflowId: string,
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await getOptionalSession(ctx, route.request);

    const workflow = await ctx.db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }

    const isOwner = session?.user?.id === workflow.userId;

    if (!isOwner && workflow.visibility !== "public") {
      return errorResponse(`Workflow not found for user ${ session?.user?.id }`, 404);
    }

    return jsonResponse({
      ...serializeWorkflow(workflow),
      nodes: isOwner
        ? workflow.nodes
        : sanitizeNodesForPublicView(workflow.nodes as Record<string, unknown>[]),
      isOwner,
    });
  } catch (error) {
    console.error("Failed to get workflow:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to get workflow",
      500,
    );
  }
}

async function updateWorkflow(
  workflowId: string,
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const existingWorkflow = await requireOwnedWorkflow(ctx, workflowId, session.user.id);
    if (!existingWorkflow) {
      return errorResponse("Workflow not found", 404);
    }

    const body = await route.request.json();

    if (Array.isArray(body.nodes) && ctx.validateIntegrations) {
      const validation = await ctx.validateIntegrations(body.nodes, session.user.id);
      if (!validation.valid) {
        return errorResponse("Invalid integration references in workflow", 403);
      }
    }

    if (
      body.visibility !== undefined &&
      body.visibility !== "private" &&
      body.visibility !== "public"
    ) {
      return errorResponse("Invalid visibility value. Must be 'private' or 'public'", 400);
    }

    const updateData = buildUpdateData(body);

    const [updatedWorkflow] = await ctx.db
      .update(workflows)
      .set(updateData)
      .where(eq(workflows.id, workflowId))
      .returning();

    if (!updatedWorkflow) {
      return errorResponse("Workflow not found", 404);
    }

    return jsonResponse({
      ...serializeWorkflow(updatedWorkflow),
      isOwner: true,
    });
  } catch (error) {
    console.error("Failed to update workflow:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update workflow",
      500,
    );
  }
}

async function deleteWorkflow(
  workflowId: string,
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const existingWorkflow = await requireOwnedWorkflow(ctx, workflowId, session.user.id);
    if (!existingWorkflow) {
      return errorResponse("Workflow not found", 404);
    }

    await ctx.db.delete(workflows).where(eq(workflows.id, workflowId));

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete workflow",
      500,
    );
  }
}
