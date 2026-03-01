import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../auth";
import { rebuildRequest } from "./utils";

// ============================================================================
// Auth Route Handler (passthrough to better-auth)
// ============================================================================

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function handleAuth(request: Request, pathSegments: string[]): Promise<Response> {
  // Reconstruct the auth path: /api/auth/[...all]
  // The auth handler expects the path to start with /api/auth/
  const authPath = "/api/auth/" + pathSegments.slice(1).join("/");
  const url = new URL(request.url);
  const newUrl = `${ url.origin }${ authPath }${ url.search }`;
  const newRequest = rebuildRequest(request, newUrl);

  if (request.method === "GET")
    return authGet(newRequest);

  return authPost(newRequest);
}
