import { errorResponse, jsonResponse, requireOwnedWorkflow, requireSession } from '../handler-utils.js';
import type { RouteHandler } from '../types.js';

export const workflowDownload: RouteHandler = async (route, ctx) => {
  try {
    const workflowId = route.segments[0];

    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    if (!ctx.generateDownload) {
      return errorResponse('Download generation not configured', 501);
    }

    const workflow = await requireOwnedWorkflow(ctx, workflowId, session.user.id);
    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    const result = await ctx.generateDownload(workflow);

    return jsonResponse(result);
  } catch (error) {
    console.error('Failed to prepare workflow download:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to prepare workflow download',
      500,
    );
  }
};
