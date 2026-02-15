import { eq } from "drizzle-orm";
import { workflowExecutions, workflows } from "../../../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../../../types.js";

async function runInBackground(
  ctx: HandlerContext,
  executionId: string,
  workflowId: string,
  // biome-ignore lint/suspicious/noExplicitAny: JSONB node/edge types
  nodes: any[],
  // biome-ignore lint/suspicious/noExplicitAny: JSONB node/edge types
  edges: any[],
  input: Record<string, unknown>,
) {
  try {
    console.log("[Workflow Execute] Starting execution:", executionId);

    if (ctx.startExecution && ctx.executeWorkflow) {
      ctx.startExecution(ctx.executeWorkflow, [
        { nodes, edges, triggerInput: input, executionId, workflowId },
      ]);
    }

    console.log("[Workflow Execute] Workflow started successfully");
  } catch (error) {
    console.error("[Workflow Execute] Error during execution:", error);

    await ctx.db
      .update(workflowExecutions)
      .set({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));
  }
}

export const executeWorkflowBackground: RouteHandler = async (route, ctx) => {
  try {
    const workflowId = route.segments[1];

    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    if (!ctx.startExecution || !ctx.executeWorkflow) {
      return errorResponse("Workflow execution not configured", 501);
    }

    const workflow = await ctx.db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }

    if (workflow.userId !== session.user.id) {
      return errorResponse("Forbidden", 403);
    }

    if (ctx.validateIntegrations) {
      const validation = await ctx.validateIntegrations(workflow.nodes, session.user.id);
      if (!validation.valid) {
        console.error("[Workflow Execute] Invalid integration references:", validation.invalidIds);
        return errorResponse("Workflow contains invalid integration references", 403);
      }
    }

    const body = await route.request.json().catch(() => ({}));
    const input = body.input || {};

    const [execution] = await ctx.db
      .insert(workflowExecutions)
      .values({
        workflowId,
        userId: session.user.id,
        status: "running",
        input,
      })
      .returning();

    console.log("[API] Created execution:", execution.id);

    // Execute in background (don't await)
    runInBackground(ctx, execution.id, workflowId, workflow.nodes, workflow.edges, input);

    return jsonResponse({ executionId: execution.id, status: "running" });
  } catch (error) {
    console.error("Failed to start workflow execution:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to execute workflow",
      500,
    );
  }
};
