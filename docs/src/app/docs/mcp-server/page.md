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
    loginPage: "/sign-in", // optional, defaults to "/sign-in"
  },
});

export default withNWB({});
```

## Database migration

The MCP server uses better-auth's `mcp` plugin, which creates additional OAuth tables (`oauthApplication`, `oauthAccessToken`, `oauthConsent`). Run your migration command after enabling:

```bash
npx drizzle-kit push
# or
npx nwb migrate
```

## Authentication

The MCP server uses OAuth 2.1 for authentication via better-auth's built-in MCP plugin. The following endpoints are automatically available:

| Endpoint | Description |
| --- | --- |
| `GET /api/workflow-builder/.well-known/oauth-authorization-server` | OAuth discovery metadata |
| `GET /api/workflow-builder/.well-known/oauth-protected-resource` | Protected resource metadata |
| `POST /api/workflow-builder/auth/mcp/register` | Dynamic client registration |
| `GET /api/workflow-builder/auth/mcp/authorize` | Authorization endpoint |
| `POST /api/workflow-builder/auth/mcp/token` | Token endpoint |

MCP clients handle the OAuth flow automatically when configured with the server URL.

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

## Connecting Claude Code

Add the MCP server to your Claude Code configuration:

```json
{
  "mcpServers": {
    "workflow-builder": {
      "url": "http://localhost:3000/api/workflow-builder/mcp"
    }
  }
}
```

Claude Code will handle the OAuth authentication flow automatically on first connection.
