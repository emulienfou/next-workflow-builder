# MCP Server

The MCP (Model Context Protocol) server lets AI agents programmatically manage workflows — create, update, delete, execute, and discover available actions.

## Enabling the MCP server

Add `mcp: { enabled: true }` to your `nextWorkflowBuilder()` config:

```ts
// next.config.ts
import nextWorkflowBuilder from "next-workflow-builder";

const withNWB = nextWorkflowBuilder({
  mcp: {
    enabled: true,
    loginPage: "/auth/sign-in", // optional, defaults to "/auth/sign-in"
  },
});

export default withNWB({});
```

## OAuth discovery routes

MCP clients (e.g. Claude Desktop) expect OAuth metadata at `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` at the root level. Add these two route files to your app:

```ts
// app/.well-known/oauth-authorization-server/route.ts
export { oAuthDiscoveryHandler as GET } from "next-workflow-builder/api";
```

```ts
// app/.well-known/oauth-protected-resource/route.ts
export { oAuthResourceHandler as GET } from "next-workflow-builder/api";
```

## Database migration

The MCP server uses better-auth's `mcp` plugin, which creates additional OAuth tables (`oauthApplication`, `oauthAccessToken`, `oauthConsent`). Run your migration command after enabling:

```bash
npx drizzle-kit push
# or
npx nwb migrate
```

## Authentication

The MCP server uses **OAuth 2.1** for authentication via better-auth's built-in MCP plugin. MCP clients authenticate using **dynamic client registration** (RFC 7591) — no pre-configured `client_id` or `client_secret` is needed. The server generates credentials automatically when a client connects for the first time.

When `anonymousAuth` is enabled (default), requests with existing session cookies (e.g. from a browser) bypass OAuth and use the session directly. Unauthenticated requests receive a `401` with a `WWW-Authenticate` header pointing to the OAuth discovery metadata, allowing MCP clients to initiate the OAuth flow.

### OAuth endpoints

The following endpoints are automatically available:

| Endpoint | Description |
| --- | --- |
| `/.well-known/oauth-authorization-server` | OAuth authorization server metadata (auto-rewritten) |
| `/.well-known/oauth-protected-resource` | OAuth protected resource metadata (auto-rewritten) |
| `/api/auth/mcp/register` | Dynamic client registration |
| `/api/auth/mcp/authorize` | Authorization endpoint |
| `/api/auth/mcp/token` | Token endpoint |

## MCP endpoint

All MCP JSON-RPC messages are sent via POST to:

```
POST /api/workflow-builder/mcp
```

The endpoint uses Streamable HTTP transport in stateless mode.

## Available tools

| Tool | Description | Parameters |
| --- | --- | --- |
| `list_workflows` | List user's workflows | `limit?`, `offset?` |
| `get_workflow` | Get workflow by ID | `workflowId` |
| `create_workflow` | Create a new workflow | `name`, `description?`, `nodes`, `edges` |
| `update_workflow` | Update a workflow | `workflowId`, `name?`, `description?`, `nodes?`, `edges?` |
| `delete_workflow` | Delete a workflow | `workflowId` |
| `duplicate_workflow` | Duplicate a workflow | `workflowId` |
| `execute_workflow` | Execute a workflow | `workflowId`, `input?` |
| `get_execution_status` | Get execution status and logs | `executionId` |
| `list_available_actions` | List all plugin actions with config fields | — |
| `list_integrations` | List user's connected integrations | — |

## Connecting Claude Desktop

To connect Claude Desktop to your MCP server:

1. Open Claude Desktop settings
2. Go to the **MCP Servers** section and add a custom connector
3. Set the **Server URL** to your MCP endpoint:

```
https://your-app.vercel.app/api/workflow-builder/mcp
```

4. **Leave `client_id` and `client_secret` empty** — the server uses dynamic client registration and will generate credentials automatically
5. Click **Connect** — Claude Desktop will open a browser window for authentication
6. Sign in on the login page — after signing in, you'll be redirected back to Claude Desktop with an active connection

### Important notes

- **Do not provide a `client_id` or `client_secret`** in the connector settings. Better-auth manages OAuth clients via dynamic registration. Pre-configured client IDs from other providers (e.g. Vercel OAuth) will not work and will result in an `invalid_client` error.
- **HTTPS is required** for production deployments. For local development, use a tunnel service like [ngrok](https://ngrok.com) or [loclx](https://loclx.io) to expose your dev server with a valid certificate.
- The `BETTER_AUTH_URL` environment variable must match the URL your MCP client connects to (e.g. your Vercel deployment URL or tunnel URL).

## Connecting Claude Code

Add the MCP server to your Claude Code configuration (`.claude/settings.json` or project-level):

```json
{
  "mcpServers": {
    "workflow-builder": {
      "url": "https://your-app.vercel.app/api/workflow-builder/mcp"
    }
  }
}
```

Claude Code will handle the OAuth authentication flow automatically on first connection.

For local development:

```json
{
  "mcpServers": {
    "workflow-builder": {
      "url": "http://localhost:3000/api/workflow-builder/mcp"
    }
  }
}
```

