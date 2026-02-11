import { desc, eq, inArray } from 'drizzle-orm';
import { workflowExecutionLogs, workflowExecutions, workflows } from '../../db/schema.js';
import { errorResponse, jsonResponse, requireOwnedWorkflow, requireSession } from '../handler-utils.js';
import type { RouteHandler } from '../types.js';

export const workflowExecutionsHandler: RouteHandler = async (route, ctx) => {
  const workflowId = route.segments[0];

  if (route.method === 'GET') {
    return getExecutions(workflowId, route, ctx);
  }
  return deleteExecutions(workflowId, route, ctx);
};

async function getExecutions(
  workflowId: string,
  route: { request: Request },
  // biome-ignore lint/suspicious/noExplicitAny: HandlerContext type
  ctx: any,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const workflow = await requireOwnedWorkflow(ctx, workflowId, session.user.id);
    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    const executions = await ctx.db.query.workflowExecutions.findMany({
      where: eq(workflowExecutions.workflowId, workflowId),
      orderBy: [desc(workflowExecutions.startedAt)],
      limit: 50,
    });

    return jsonResponse(executions);
  } catch (error) {
    console.error('Failed to get executions:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get executions',
      500,
    );
  }
}

async function deleteExecutions(
  workflowId: string,
  route: { request: Request },
  // biome-ignore lint/suspicious/noExplicitAny: HandlerContext type
  ctx: any,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const workflow = await requireOwnedWorkflow(ctx, workflowId, session.user.id);
    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    const executions = await ctx.db.query.workflowExecutions.findMany({
      where: eq(workflowExecutions.workflowId, workflowId),
      columns: { id: true },
    });

    const executionIds = executions.map((e: { id: string }) => e.id);

    if (executionIds.length > 0) {
      await ctx.db
        .delete(workflowExecutionLogs)
        .where(inArray(workflowExecutionLogs.executionId, executionIds));

      await ctx.db
        .delete(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, workflowId));
    }

    return jsonResponse({ success: true, deletedCount: executionIds.length });
  } catch (error) {
    console.error('Failed to delete executions:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to delete executions',
      500,
    );
  }
}
