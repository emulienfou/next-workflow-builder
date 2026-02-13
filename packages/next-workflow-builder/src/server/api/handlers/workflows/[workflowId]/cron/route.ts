import { eq } from "drizzle-orm";
import { workflowExecutions, workflows } from "../../../../../db/schema.js";
import { errorResponse, jsonResponse } from "../../../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../../../types.js";

async function executeScheduledWorkflow(
  ctx: HandlerContext,
  executionId: string,
  workflowId: string,
  // biome-ignore lint/suspicious/noExplicitAny: JSONB node/edge types
  nodes: any[],
  // biome-ignore lint/suspicious/noExplicitAny: JSONB node/edge types
  edges: any[],
) {
  try {
    console.log("[Cron Execute] Starting scheduled execution:", executionId);

    if (ctx.startExecution && ctx.executeWorkflow) {
      ctx.startExecution(ctx.executeWorkflow, [
        { nodes, edges, triggerInput: {}, executionId, workflowId },
      ]);
    }

    console.log("[Cron Execute] Workflow started successfully");
  } catch (error) {
    console.error("[Cron Execute] Error during execution:", error);

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

export const workflowCron: RouteHandler = async (route, ctx) => {
  try {
    const workflowId = route.segments[0];

    // Verify the request is from Vercel Cron
    const authHeader = route.request.headers.get("authorization");
    if (authHeader !== `Bearer ${ process.env.CRON_SECRET }`) {
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

    const [execution] = await ctx.db
      .insert(workflowExecutions)
      .values({
        workflowId,
        userId: workflow.userId,
        status: "running",
        input: {},
      })
      .returning();

    console.log("[Cron] Created execution:", execution.id);

    // Execute in background (don't await)
    executeScheduledWorkflow(ctx, execution.id, workflowId, workflow.nodes, workflow.edges);

    return jsonResponse({
      success: true,
      workflowId,
      executionId: execution.id,
      message: "Workflow execution started",
    });
  } catch (error) {
    console.error("Scheduled workflow execution error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Execution failed",
      500,
    );
  }
};
