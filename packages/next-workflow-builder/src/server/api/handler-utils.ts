import { and, eq } from 'drizzle-orm';
import { workflows } from '../db/schema.js';
import type { AuthSession, HandlerContext } from './types.js';

export function jsonResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function errorResponse(
  message: string,
  status: number,
  headers?: Record<string, string>,
): Response {
  return jsonResponse({ error: message }, status, headers);
}

export async function requireSession(
  ctx: HandlerContext,
  request: Request,
): Promise<AuthSession | null> {
  const session = await ctx.auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.user) return null;
  return session;
}

export async function getOptionalSession(
  ctx: HandlerContext,
  request: Request,
): Promise<AuthSession | null> {
  try {
    return await ctx.auth.api.getSession({
      headers: request.headers,
    });
  } catch {
    return null;
  }
}

export async function requireOwnedWorkflow(
  ctx: HandlerContext,
  workflowId: string,
  userId: string,
) {
  return ctx.db.query.workflows.findFirst({
    where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
  });
}

export function serializeWorkflow(workflow: {
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}): Record<string, unknown> {
  return {
    ...workflow,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}
