import { eq } from "drizzle-orm";
import { executeWorkflow } from "../lib/workflow-executor.workflow";
import { db } from "../db";
import { workflowExecutions } from "../db/schema";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Extract path segments after the /api/workflow-builder/ prefix.
 * Input URL: /api/workflow-builder/workflows/abc123/executions
 * Returns: ['workflows', 'abc123', 'executions']
 */
export function extractPath(request: Request): string[] {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Find the workflow-builder prefix and extract everything after it
  const prefix = "/api/workflow-builder/";
  const idx = pathname.indexOf(prefix);
  if (idx === -1) {
    // Fallback: try to extract path segments after /api/
    const apiIdx = pathname.indexOf("/api/");
    if (apiIdx === -1) return [];
    const afterApi = pathname.slice(apiIdx + 5);
    return afterApi.split("/").filter(Boolean);
  }

  const afterPrefix = pathname.slice(idx + prefix.length);
  return afterPrefix.split("/").filter(Boolean);
}

/**
 * Helper: rebuild a request with a new URL (for auth handler passthrough)
 */
export function rebuildRequest(request: Request, newUrl: string): Request {
  return new Request(newUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: "half",
  } as RequestInit & { duplex?: string });
}


export type WorkflowNodeLike = {
  id: string;
  data: { type?: string; config?: Record<string, unknown>; [k: string]: unknown };
  [k: string]: unknown
}
export type WorkflowEdgeLike = { id: string; source: string; target: string; [k: string]: unknown }

export async function executeWorkflowBackground(
  executionId: string,
  workflowId: string,
  nodes: WorkflowNodeLike[],
  edges: WorkflowEdgeLike[],
  input: Record<string, unknown>,
) {
  try {
    await executeWorkflow({
      nodes: nodes as Parameters<typeof executeWorkflow>[0]["nodes"],
      edges: edges as Parameters<typeof executeWorkflow>[0]["edges"],
      triggerInput: input,
      executionId,
      workflowId,
    });
  } catch (error) {
    console.error("[Workflow Execute] Error during execution:", error);
    await db
      .update(workflowExecutions)
      .set({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));
  }
}

export function buildWorkflowUpdateData(body: Record<string, unknown>): Record<string, unknown> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.nodes !== undefined) updateData.nodes = body.nodes;
  if (body.edges !== undefined) updateData.edges = body.edges;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;
  return updateData;
}

export function sanitizeNodesForPublicView(
  nodes: Record<string, unknown>[],
): Record<string, unknown>[] {
  return nodes.map((node) => {
    const sanitizedNode = { ...node };
    if (sanitizedNode.data && typeof sanitizedNode.data === "object" && sanitizedNode.data !== null) {
      const data = { ...(sanitizedNode.data as Record<string, unknown>) };
      if (data.config && typeof data.config === "object" && data.config !== null) {
        const { integrationId: _, ...configWithoutIntegration } = data.config as Record<string, unknown>;
        data.config = configWithoutIntegration;
      }
      sanitizedNode.data = data;
    }
    return sanitizedNode;
  });
}
