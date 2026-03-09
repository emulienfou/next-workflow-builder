import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools";

export function createMcpServer(userId: string) {
  const server = new McpServer({
    name: "workflow-builder",
    version: "1.0.0",
  });
  registerTools(server, userId);
  return server;
}
