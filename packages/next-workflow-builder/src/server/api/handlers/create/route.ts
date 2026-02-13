import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { workflows } from '../../../db/schema.js';
import { generateId } from '../../../../lib/utils/id.js';
import { errorResponse, jsonResponse, requireSession, serializeWorkflow } from '../../handler-utils.js';
import type { RouteHandler } from '../../types.js';

function createDefaultTriggerNode() {
  return {
    id: nanoid(),
    type: 'trigger' as const,
    position: { x: 0, y: 0 },
    data: {
      label: '',
      description: '',
      type: 'trigger' as const,
      config: { triggerType: 'Manual' },
      status: 'idle' as const,
    },
  };
}

export const createWorkflow: RouteHandler = async (route, ctx) => {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await route.request.json();

    if (!(body.name && body.nodes && body.edges)) {
      return errorResponse('Name, nodes, and edges are required', 400);
    }

    // Validate integration references if validator is provided
    if (ctx.validateIntegrations) {
      const validation = await ctx.validateIntegrations(body.nodes, session.user.id);
      if (!validation.valid) {
        return errorResponse('Invalid integration references in workflow', 403);
      }
    }

    // Ensure there's always a trigger node
    let nodes = body.nodes;
    if (nodes.length === 0) {
      nodes = [createDefaultTriggerNode()];
    }

    // Generate "Untitled N" name if the provided name is "Untitled Workflow"
    let workflowName = body.name;
    if (body.name === 'Untitled Workflow') {
      const userWorkflows = await ctx.db.query.workflows.findMany({
        where: eq(workflows.userId, session.user.id),
      });
      const count = userWorkflows.length + 1;
      workflowName = `Untitled ${count}`;
    }

    const workflowId = generateId();

    const [newWorkflow] = await ctx.db
      .insert(workflows)
      .values({
        id: workflowId,
        name: workflowName,
        description: body.description,
        nodes,
        edges: body.edges,
        userId: session.user.id,
      })
      .returning();

    return jsonResponse(serializeWorkflow(newWorkflow));
  } catch (error) {
    console.error('Failed to create workflow:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create workflow',
      500,
    );
  }
};
