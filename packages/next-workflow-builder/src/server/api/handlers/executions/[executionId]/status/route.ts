import { eq } from 'drizzle-orm';
import { workflowExecutionLogs, workflowExecutions } from '../../../../../db/schema.js';
import { errorResponse, jsonResponse, requireSession } from '../../../../handler-utils.js';
import type { RouteHandler } from '../../../../types.js';

export const executionStatus: RouteHandler = async (route, ctx) => {
  try {
    // segments: ['executions', '<executionId>', 'status']
    const executionId = route.segments[1];

    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const execution = await ctx.db.query.workflowExecutions.findFirst({
      where: eq(workflowExecutions.id, executionId),
      with: { workflow: true },
    });

    if (!execution) {
      return errorResponse('Execution not found', 404);
    }

    if (execution.workflow.userId !== session.user.id) {
      return errorResponse('Forbidden', 403);
    }

    const logs = await ctx.db.query.workflowExecutionLogs.findMany({
      where: eq(workflowExecutionLogs.executionId, executionId),
    });

    const nodeStatuses = logs.map(
      (log: { nodeId: string; status: string }) => ({
        nodeId: log.nodeId,
        status: log.status,
      }),
    );

    return jsonResponse({ status: execution.status, nodeStatuses });
  } catch (error) {
    console.error('Failed to get execution status:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get execution status',
      500,
    );
  }
};
