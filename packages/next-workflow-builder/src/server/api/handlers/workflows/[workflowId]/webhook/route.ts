import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { apiKeys, workflowExecutions, workflows } from "../../../../../db/schema.js";
import { errorResponse, jsonResponse } from "../../../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../../../types.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function validateApiKey(
  // biome-ignore lint/suspicious/noExplicitAny: db type varies
  db: any,
  authHeader: string | null,
  workflowUserId: string,
): Promise<{ valid: boolean; error?: string; statusCode?: number }> {
  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header", statusCode: 401 };
  }

  const key = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  if (!key?.startsWith("wfb_")) {
    return { valid: false, error: "Invalid API key format", statusCode: 401 };
  }

  const keyHash = createHash("sha256").update(key).digest("hex");

  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });

  if (!apiKey) {
    return { valid: false, error: "Invalid API key", statusCode: 401 };
  }

  if (apiKey.userId !== workflowUserId) {
    return {
      valid: false,
      error: "You do not have permission to run this workflow",
      statusCode: 403,
    };
  }

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .catch(() => {
    });

  return { valid: true };
}

async function executeWorkflowBackground(
  ctx: HandlerContext,
  executionId: string,
  workflowId: string,
  // biome-ignore lint/suspicious/noExplicitAny: JSONB types
  nodes: any[],
  // biome-ignore lint/suspicious/noExplicitAny: JSONB types
  edges: any[],
  input: Record<string, unknown>,
) {
  try {
    console.log("[Webhook] Starting execution:", executionId);

    if (ctx.startExecution && ctx.executeWorkflow) {
      ctx.startExecution(ctx.executeWorkflow, [
        { nodes, edges, triggerInput: input, executionId, workflowId },
      ]);
    }

    console.log("[Webhook] Workflow started successfully");
  } catch (error) {
    console.error("[Webhook] Error during execution:", error);

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

export const workflowWebhook: RouteHandler = async (route, ctx) => {
  if (route.method === "OPTIONS") {
    return jsonResponse({}, 200, corsHeaders);
  }

  try {
    const workflowId = route.segments[1];

    if (!ctx.startExecution || !ctx.executeWorkflow) {
      return errorResponse("Workflow execution not configured", 501);
    }

    const workflow = await ctx.db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }

    // Validate API key
    const authHeader = route.request.headers.get("Authorization");
    const apiKeyValidation = await validateApiKey(ctx.db, authHeader, workflow.userId);

    if (!apiKeyValidation.valid) {
      return errorResponse(
        apiKeyValidation.error || "Unauthorized",
        apiKeyValidation.statusCode || 401,
        corsHeaders,
      );
    }

    // Verify webhook trigger
    // biome-ignore lint/suspicious/noExplicitAny: JSONB node type
    const triggerNode = (workflow.nodes as any[]).find(
      // biome-ignore lint/suspicious/noExplicitAny: JSONB node type
      (node: any) => node.data.type === "trigger",
    );

    if (!triggerNode || triggerNode.data.config?.triggerType !== "Webhook") {
      return errorResponse(
        "This workflow is not configured for webhook triggers",
        400,
        corsHeaders,
      );
    }

    // Validate integration references if validator is provided
    if (ctx.validateIntegrations) {
      const validation = await ctx.validateIntegrations(workflow.nodes, workflow.userId);
      if (!validation.valid) {
        console.error("[Webhook] Invalid integration references:", validation.invalidIds);
        return errorResponse(
          "Workflow contains invalid integration references",
          403,
          corsHeaders,
        );
      }
    }

    const body = await route.request.json().catch(() => ({}));

    const [execution] = await ctx.db
      .insert(workflowExecutions)
      .values({
        workflowId,
        userId: workflow.userId,
        status: "running",
        input: body,
      })
      .returning();

    console.log("[Webhook] Created execution:", execution.id);

    // Execute in background (don't await)
    executeWorkflowBackground(ctx, execution.id, workflowId, workflow.nodes, workflow.edges, body);

    return jsonResponse({ executionId: execution.id, status: "running" }, 200, corsHeaders);
  } catch (error) {
    console.error("[Webhook] Failed to start workflow execution:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to execute workflow",
      500,
      corsHeaders,
    );
  }
};
