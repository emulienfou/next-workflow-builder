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
import type { ParsedRoute, RouteHandler, WorkflowApiHandlerOptions } from "./types.js";

type RouteDefinition = {
  path: string;
  handler: RouteHandler;
  methods: string[];
};

const routes: RouteDefinition[] = [
  { path: "", handler: listWorkflows, methods: ["GET"] },
  { path: "create", handler: createWorkflow, methods: ["POST"] },
  { path: "current", handler: currentWorkflow, methods: ["GET", "POST"] },
  { path: "[id]", handler: workflowCrud, methods: ["GET", "PATCH", "DELETE"] },
  { path: "[id]/code", handler: workflowCode, methods: ["GET"] },
  { path: "[id]/download", handler: workflowDownload, methods: ["GET"] },
  { path: "[id]/duplicate", handler: workflowDuplicate, methods: ["POST"] },
  { path: "[id]/executions", handler: workflowExecutionsHandler, methods: ["GET", "DELETE"] },
  { path: "[id]/execute", handler: workflowExecute, methods: ["POST"] },
  { path: "[id]/cron", handler: workflowCron, methods: ["GET"] },
  { path: "[id]/webhook", handler: workflowWebhook, methods: ["POST", "OPTIONS"] },
  { path: "executions/[executionId]/logs", handler: executionLogs, methods: ["GET"] },
  { path: "executions/[executionId]/status", handler: executionStatus, methods: ["GET"] },
];

function matchRoute(segments: string[]): { handler: RouteHandler; methods: string[] } | null {
  for (const route of routes) {
    const patternSegments = route.path === "" ? [] : route.path.split("/");
    if (patternSegments.length !== segments.length) continue;

    const isMatch = patternSegments.every(
      (pattern, i) => pattern.startsWith("[") && pattern.endsWith("]") || pattern === segments[i],
    );

    if (isMatch) {
      return { handler: route.handler, methods: route.methods };
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
