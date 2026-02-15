import { betterAuth } from "better-auth";
import { getDefaultAuthOptions } from "../../lib/auth.js";
import { getDb } from "../../lib/db/index.js";
import { errorResponse } from "./handler-utils.js";
import routes from "./routes.js";
import type { ParsedRoute, RouteHandler, WorkflowApiHandlerOptions } from "./types.js";

/**
 * Matches a URL path segment array against the defined routes.
 *
 * @param segments - An array of path segments from the URL
 * @returns An object containing the route handler and allowed methods, or null if no match is found
 */
function matchRoute(segments: string[]): { handler: RouteHandler; methods: string[] } | null {
  for (const route of routes) {
    const patternSegments = route.path === "" ? [] : route.path.split("/").filter(Boolean);

    let isMatch = true;
    for (let i = 0; i < patternSegments.length; i++) {
      const pattern = patternSegments[i];

      // Catch-all pattern like [...all] matches one or more remaining segments
      if (pattern.startsWith("[...") && pattern.endsWith("]")) {
        isMatch = segments.length > i; // must match at least one segment
        break;
      }

      // Not enough segments to match this pattern
      if (i >= segments.length) {
        isMatch = false;
        break;
      }

      // Dynamic segment like [id] matches any single segment
      if (pattern.startsWith("[") && pattern.endsWith("]")) {
        continue;
      }

      // Exact match
      if (pattern !== segments[i]) {
        isMatch = false;
        break;
      }
    }

    // If no catch-all was found, lengths must match exactly
    const hasCatchAll = patternSegments.some(p => p.startsWith("[...") && p.endsWith("]"));
    if (isMatch && !hasCatchAll && patternSegments.length !== segments.length) {
      isMatch = false;
    }

    if (isMatch) {
      return { handler: route.handler, methods: route.methods };
    }
  }
  return null;
}

/**
 * Creates a Next.js API route handler for workflow operations.
 *
 * This handler manages routing for workflow-related endpoints, including authentication
 * and request parsing. It supports both Next.js App Router (via params) and
 * standard Request-based routing.
 *
 * @param options - Configuration options including authentication and database adapters
 * @returns An async function compatible with Next.js route handlers
 *
 * @example
 * ```ts
 * export const GET = createWorkflowApiHandler(options);
 * export const POST = createWorkflowApiHandler(options);
 * ```
 */
export function createWorkflowApiHandler(options?: WorkflowApiHandlerOptions) {
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
        // Remove 'api' prefix
        const apiIdx = pathParts.indexOf("api");
        segments = apiIdx >= 0 ? pathParts.slice(apiIdx + 1) : pathParts;
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

      // Initialize Drizzle from env
      const db = getDb();

      // Initialize Better Auth
      const auth = betterAuth({ ...getDefaultAuthOptions(db), ...options?.authOptions });

      return await match.handler(route, { ...options, auth, db });
    } catch (error) {
      console.error("[WorkflowAPI] Unhandled error:", error);
      return errorResponse("Internal server error", 500);
    }
  };
}

export type { WorkflowApiHandlerOptions };
