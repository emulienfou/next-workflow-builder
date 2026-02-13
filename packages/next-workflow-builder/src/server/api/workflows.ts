import { errorResponse } from "./handler-utils.js";
import { workflowCode } from "./handlers/workflows/[workflowId]/code/route.js";
import { workflowCron } from "./handlers/workflows/[workflowId]/cron/route.js";
import { workflowDownload } from "./handlers/workflows/[workflowId]/download/route.js";
import { workflowDuplicate } from "./handlers/workflows/[workflowId]/duplicate/route.js";
import { workflowExecute } from "./handlers/workflows/[workflowId]/execute/route.js";
import { workflowExecutionsHandler } from "./handlers/workflows/[workflowId]/executions/route.js";
import { workflowCrud } from "./handlers/workflows/[workflowId]/route.js";
import { workflowWebhook } from "./handlers/workflows/[workflowId]/webhook/route.js";
import { createWorkflow } from "./handlers/workflows/create/route.js";
import { currentWorkflow } from "./handlers/workflows/current/route.js";
import { executionLogs } from "./handlers/workflows/executions/[executionId]/logs/route.js";
import { executionStatus } from "./handlers/workflows/executions/[executionId]/status/route.js";
import { listWorkflows } from "./handlers/workflows/route";
import type { ParsedRoute, RouteHandler, WorkflowApiHandlerOptions } from "./types.js";

type RouteDefinition = {
  path: string;
  handler: RouteHandler;
  methods: string[];
};

const routes: RouteDefinition[] = [
  { path: "/workflows/[workflowId]", handler: workflowCrud, methods: ["GET", "PATCH", "DELETE"] },
  { path: "/workflows/[workflowId]/code", handler: workflowCode, methods: ["GET"] },
  { path: "/workflows/[workflowId]/cron", handler: workflowCron, methods: ["GET"] },
  { path: "/workflows/[workflowId]/download", handler: workflowDownload, methods: ["GET"] },
  { path: "/workflows/[workflowId]/duplicate", handler: workflowDuplicate, methods: ["POST"] },
  { path: "/workflows/[workflowId]/execute", handler: workflowExecute, methods: ["POST"] },
  { path: "/workflows/[workflowId]/executions", handler: workflowExecutionsHandler, methods: ["GET", "DELETE"] },
  { path: "/workflows/[workflowId]/webhook", handler: workflowWebhook, methods: ["POST", "OPTIONS"] },
  { path: "/workflows/create", handler: createWorkflow, methods: ["POST"] },
  { path: "/workflows/current", handler: currentWorkflow, methods: ["GET", "POST"] },
  { path: "/workflows/executions/[executionId]/logs", handler: executionLogs, methods: ["GET"] },
  { path: "/workflows/executions/[executionId]/status", handler: executionStatus, methods: ["GET"] },
  { path: "/workflows", handler: listWorkflows, methods: ["GET"] },
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
