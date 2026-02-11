import { and, desc, eq } from 'drizzle-orm';
import { workflows } from '../../db/schema.js';
import { generateId } from '../../../lib/utils/id.js';
import { errorResponse, jsonResponse, requireSession } from '../handler-utils.js';
import type { RouteHandler } from '../types.js';

const CURRENT_WORKFLOW_NAME = '~~__CURRENT__~~';

export const currentWorkflow: RouteHandler = async (route, ctx) => {
  if (route.method === 'GET') {
    return getCurrentWorkflow(route, ctx);
  }
  return saveCurrentWorkflow(route, ctx);
};

const getCurrentWorkflow: RouteHandler = async (route, ctx) => {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const [currentWf] = await ctx.db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.name, CURRENT_WORKFLOW_NAME),
          eq(workflows.userId, session.user.id),
        ),
      )
      .orderBy(desc(workflows.updatedAt))
      .limit(1);

    if (!currentWf) {
      return jsonResponse({ nodes: [], edges: [] });
    }

    return jsonResponse({
      id: currentWf.id,
      nodes: currentWf.nodes,
      edges: currentWf.edges,
    });
  } catch (error) {
    console.error('Failed to get current workflow:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get current workflow',
      500,
    );
  }
};

const saveCurrentWorkflow: RouteHandler = async (route, ctx) => {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await route.request.json();
    const { nodes, edges } = body;

    if (!(nodes && edges)) {
      return errorResponse('Nodes and edges are required', 400);
    }

    // Check if current workflow exists
    const [existingWorkflow] = await ctx.db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.name, CURRENT_WORKFLOW_NAME),
          eq(workflows.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingWorkflow) {
      const [updatedWorkflow] = await ctx.db
        .update(workflows)
        .set({ nodes, edges, updatedAt: new Date() })
        .where(eq(workflows.id, existingWorkflow.id))
        .returning();

      return jsonResponse({
        id: updatedWorkflow.id,
        nodes: updatedWorkflow.nodes,
        edges: updatedWorkflow.edges,
      });
    }

    const workflowId = generateId();

    const [savedWorkflow] = await ctx.db
      .insert(workflows)
      .values({
        id: workflowId,
        name: CURRENT_WORKFLOW_NAME,
        description: 'Auto-saved current workflow',
        nodes,
        edges,
        userId: session.user.id,
      })
      .returning();

    return jsonResponse({
      id: savedWorkflow.id,
      nodes: savedWorkflow.nodes,
      edges: savedWorkflow.edges,
    });
  } catch (error) {
    console.error('Failed to save current workflow:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to save current workflow',
      500,
    );
  }
};
