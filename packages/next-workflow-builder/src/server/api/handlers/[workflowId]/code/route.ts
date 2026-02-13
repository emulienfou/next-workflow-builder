import { and, eq } from 'drizzle-orm';
import { workflows } from '../../../../db/schema.js';
import { errorResponse, jsonResponse, requireOwnedWorkflow, requireSession } from '../../../handler-utils.js';
import type { RouteHandler } from '../../../types.js';

export const workflowCode: RouteHandler = async (route, ctx) => {
  try {
    const workflowId = route.segments[0];

    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    if (!ctx.generateCode) {
      return errorResponse('Code generation not configured', 501);
    }

    const workflow = await requireOwnedWorkflow(ctx, workflowId, session.user.id);
    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    const code = ctx.generateCode(workflow.name, workflow.nodes, workflow.edges);

    return jsonResponse({ code, workflowName: workflow.name });
  } catch (error) {
    console.error('Failed to get workflow code:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get workflow code',
      500,
    );
  }
};
