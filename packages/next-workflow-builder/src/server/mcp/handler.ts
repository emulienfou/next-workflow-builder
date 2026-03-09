import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { withMcpAuth } from "better-auth/plugins";
import { auth } from "../auth";
import { createMcpServer } from "./server";

export async function handleMcpRequest(request: Request): Promise<Response> {
  if (request.method === "POST") {
    // Cast auth — the mcp plugin is conditionally added at runtime,
    // so the static type doesn't include getMcpSession.
    return withMcpAuth(auth as any, async (req, session) => {
      const server = createMcpServer(session.userId!);
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      return await transport.handleRequest(req);
    })(request);
  }

  // GET (SSE) and DELETE (session cleanup) not needed for stateless mode
  return new Response("Method not allowed", { status: 405 });
}
