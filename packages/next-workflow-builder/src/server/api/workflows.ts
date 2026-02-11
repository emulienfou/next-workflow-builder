import { errorResponse } from "./handler-utils.js";
import { createWorkflow } from "./handlers/create-workflow.js";
import { currentWorkflow } from "./handlers/current-workflow.js";
import { executionLogs } from "./handlers/execution-logs.js";
import { executionStatus } from "./handlers/execution-status.js";
import { listWorkflows } from "./handlers/list-workflows.js";
import { workflowCode } from "./handlers/workflow-code.js";
import { workflowCron } from "./handlers/workflow-cron.js";
import { workflowCrud } from "./handlers/workflow-crud.js";
import { workflowDownload } from "./handlers/workflow-download.js";
import { workflowDuplicate } from "./handlers/workflow-duplicate.js";
import { workflowExecute } from "./handlers/workflow-execute.js";
import { workflowExecutionsHandler } from "./handlers/workflow-executions.js";
import { workflowWebhook } from "./handlers/workflow-webhook.js";
import type { HandlerContext, ParsedRoute, RouteHandler, WorkflowApiHandlerOptions } from "./types.js";

type RouteMatch = {
  handler: RouteHandler;
  methods: string[];
};

function matchRoute(segments: string[]): RouteMatch | null {
  // Empty slug → list all workflows
  if (segments.length === 0) {
    return { handler: listWorkflows, methods: ["GET"] };
  }

  // Single segment
  if (segments.length === 1) {
    if (segments[0] === "create") {
      return { handler: createWorkflow, methods: ["POST"] };
    }
    if (segments[0] === "current") {
      return { handler: currentWorkflow, methods: ["GET", "POST"] };
    }
    // Treat as workflow ID
    return { handler: workflowCrud, methods: ["GET", "PATCH", "DELETE"] };
  }

  // Two segments: <id>/<action>
  if (segments.length === 2) {
    switch (segments[1]) {
      case "code":
        return { handler: workflowCode, methods: ["GET"] };
      case "download":
        return { handler: workflowDownload, methods: ["GET"] };
      case "duplicate":
        return { handler: workflowDuplicate, methods: ["POST"] };
      case "executions":
        return { handler: workflowExecutionsHandler, methods: ["GET", "DELETE"] };
      case "execute":
        return { handler: workflowExecute, methods: ["POST"] };
      case "cron":
        return { handler: workflowCron, methods: ["GET"] };
      case "webhook":
        return { handler: workflowWebhook, methods: ["POST", "OPTIONS"] };
    }
  }

  // Three segments: executions/<id>/<action>
  if (segments.length === 3 && segments[0] === "executions") {
    switch (segments[2]) {
      case "logs":
        return { handler: executionLogs, methods: ["GET"] };
      case "status":
        return { handler: executionStatus, methods: ["GET"] };
    }
  }

  return null;
}

export function createWorkflowApiHandler(options: WorkflowApiHandlerOptions) {
  return async function handler(
    req: Request,
    nextCtx?: { params: Promise<{ slug?: string[] }> },
  ) {
    try {
      // Extract slug from Next.js route params or fall back to URL parsing
      let segments: string[];

      if (nextCtx?.params) {
        const params = await nextCtx.params;
        segments = params.slug || [];
      } else {
        // Fallback: parse from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/").filter(Boolean);
        // Remove 'api' and 'workflow' prefix
        const apiIdx = pathParts.indexOf("api");
        const workflowIdx = apiIdx >= 0 ? pathParts.indexOf("workflow", apiIdx) : -1;
        segments = workflowIdx >= 0 ? pathParts.slice(workflowIdx + 1) : pathParts;
      }

      const method = req.method;
      const match = matchRoute(segments);

      if (!match) {
        return errorResponse("Not found", 404);
      }

      if (!match.methods.includes(method)) {
        return errorResponse("Method not allowed", 405);
      }

      const route: ParsedRoute = { segments, method, request: req };

      return await match.handler(route, options);
    } catch (error) {
      console.error("[WorkflowAPI] Unhandled error:", error);
      return errorResponse("Internal server error", 500);
    }
  };
}

export type { WorkflowApiHandlerOptions };
