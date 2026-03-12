# API Reference

## Package exports

The package provides several entry points:

| Import path | Description |
| --- | --- |
| `next-workflow-builder` | Next.js plugin: `nextWorkflowBuilder()` config wrapper |
| `next-workflow-builder/client` | React components: `Layout`, `WorkflowPage`, `WorkflowEditor` |
| `next-workflow-builder/server` | Server-side: auth, db, schema tables, credentials, metadata, logging |
| `next-workflow-builder/api` | HTTP route handlers: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` |
| `next-workflow-builder/plugins` | Plugin system: registration, registry utilities, types |
| `next-workflow-builder/server/db/schema` | Drizzle ORM schema (for `drizzle.config.ts`) |
| `next-workflow-builder/styles.css` | Required CSS styles |

---

## Main export (`next-workflow-builder`)

```ts
import nextWorkflowBuilder from "next-workflow-builder";
import type { NextWorkflowBuilderConfig, WithNextWorkflowBuilder } from "next-workflow-builder";
```

### `nextWorkflowBuilder(config?)`

The default export. Returns a function that wraps your Next.js config.

```ts
const withNextWorkflowBuilder = nextWorkflowBuilder({
  authOptions: { /* Better Auth options */ },
  debug: true,
});
const nextConfig = withNextWorkflowBuilder({ /* Next.js config */ });
```

**Parameters:** `NextWorkflowBuilderConfig` (see [Configuration](/docs/configuration))
**Returns:** `(nextConfig: NextConfig) => NextConfig`

---

## API export (`next-workflow-builder/api`)

```ts
export { GET, POST, PUT, PATCH, DELETE, OPTIONS } from "next-workflow-builder/api";
```

Re-export these HTTP method handlers in your catch-all API route (`app/api/[[...slug]]/route.ts`).
They handle all workflow, auth, integration, and API key endpoints.

---

## Server exports (`next-workflow-builder/server`)

```ts
import {
  auth,
  db,
  fetchCredentials,
  generateWorkflowMetadata,
  withStepLogging,
  generateId,
  encrypt,
  decrypt,
  getErrorMessage,
  getErrorMessageAsync,
  discoverPlugins,
  // Database tables
  users,
  sessions,
  accounts,
  verifications,
  workflows,
  integrations,
  workflowExecutions,
  workflowExecutionLogs,
  apiKeys,
} from "next-workflow-builder/server";

import type { StepInput, ResultComponentProps } from "next-workflow-builder/server";
```

### `auth`

The Better Auth instance. Use for session management:

```ts
const session = await auth.api.getSession({ headers: request.headers });
```

### `db`

The Drizzle ORM database instance with the full schema:

```ts
const userWorkflows = await db.query.workflows.findMany({
  where: eq(workflows.userId, userId),
});
```

### `fetchCredentials(integrationId)`

Fetch and decrypt credentials for an integration. Used in step handlers.

```ts
const credentials = await fetchCredentials(input.integrationId);
```

**Parameters:** `string` - Integration ID
**Returns:** `Promise<Record<string, string>>`

### `generateWorkflowMetadata(props)`

Generate dynamic page metadata for workflow pages. Export as `generateMetadata` in your catch-all page:

```ts
export { generateWorkflowMetadata as generateMetadata } from "next-workflow-builder/server";
```

### `withStepLogging(input, fn)`

Wrap a step handler function with execution logging for the workflow runs panel.

```ts
return withStepLogging(input, () => stepHandler(input, credentials));
```

**Parameters:**
- `input` - `StepInput` object
- `fn` - `() => Promise<T>` - The step handler function

**Returns:** `Promise<T>`

### `encrypt(text)` / `decrypt(text)`

Encrypt and decrypt integration credentials stored in the database.

### `generateId()`

Generate a unique nanoid-based identifier for database records.

### `getErrorMessage(error)` / `getErrorMessageAsync(error)`

Extract a human-readable error message from unknown error types.

### Database tables

All Drizzle ORM table schemas are exported directly: `users`, `sessions`, `accounts`, `verifications`, `workflows`, `integrations`, `workflowExecutions`, `workflowExecutionLogs`, `apiKeys`.

---

## Plugin exports (`next-workflow-builder/plugins`)

```ts
import {
  registerIntegration,
  registerCodegenTemplates,
  registerOutputDisplayConfigs,
  getIntegration,
  getAllIntegrations,
  getIntegrationTypes,
  getAllActions,
  getActionsByCategory,
  findActionById,
  getCodegenTemplate,
  getOutputDisplayConfig,
  computeActionId,
  parseActionId,
  flattenConfigFields,
  isFieldGroup,
  getIntegrationLabels,
  getIntegrationDescriptions,
  getSortedIntegrationTypes,
  getAllDependencies,
  getDependenciesForActions,
  getAllEnvVars,
  getPluginEnvVars,
  getCredentialMapping,
  generateAIActionPrompts,
} from "next-workflow-builder/plugins";
```

### `registerIntegration(plugin)`

Register a plugin with the integration registry.

```ts
registerIntegration(myPlugin);
```

**Parameters:** `IntegrationPlugin` - The plugin definition object

### `registerCodegenTemplates(templates)`

Register code generation templates. Called from auto-generated `lib/codegen-registry.ts`.

### `registerOutputDisplayConfigs(configs)`

Register output display configurations. Called from auto-generated `lib/output-display-configs.ts`.

### Registry query functions

| Function | Returns | Description |
| --- | --- | --- |
| `getIntegration(type)` | `IntegrationPlugin \| undefined` | Get a single integration plugin |
| `getAllIntegrations()` | `IntegrationPlugin[]` | Get all registered integrations |
| `getIntegrationTypes()` | `string[]` | Get list of all integration type slugs |
| `getAllActions()` | `ActionWithFullId[]` | Get all actions across integrations |
| `getActionsByCategory()` | `Record<string, ActionWithFullId[]>` | Get actions grouped by category |
| `findActionById(id)` | `ActionWithFullId \| undefined` | Find action by full ID or legacy label |
| `getCodegenTemplate(id)` | `string \| undefined` | Get codegen template for an action |
| `getOutputDisplayConfig(id)` | `OutputDisplayConfig \| undefined` | Get output display config |

### Utility functions

| Function | Description |
| --- | --- |
| `computeActionId(type, slug)` | Compute full action ID (e.g. `"slack/send-message"`) |
| `parseActionId(id)` | Parse action ID into `{ integration, slug }` |
| `flattenConfigFields(fields)` | Flatten config field groups into flat array |
| `isFieldGroup(field)` | Type guard for `ActionConfigFieldGroup` |
| `getAllDependencies()` | Get all NPM dependencies across integrations |
| `getDependenciesForActions(ids)` | Get dependencies for specific actions |
| `getAllEnvVars()` | Get all environment variables across integrations |
| `getPluginEnvVars(plugin)` | Get env vars for a single plugin |
| `getCredentialMapping(plugin, config)` | Get credential mapping for a plugin |
| `generateAIActionPrompts()` | Generate AI prompt section for all actions |

---

## Client export (`next-workflow-builder/client`)

```ts
import {
  Layout,
  WorkflowPage,
  WorkflowEditor,
  isAiGatewayManagedKeysEnabled,
  isAiGatewayManagedKeysEnabledClient,
} from "next-workflow-builder/client";
```

See [Components](/docs/components) for detailed component documentation.

---

## Types

### `IntegrationPlugin`

Full plugin definition. See [Creating Plugins](/docs/creating-plugins) for field details.

### `PluginAction`

Action definition within a plugin.

### `ActionConfigField`

Config field definition. Can be `ActionConfigFieldBase` or `ActionConfigFieldGroup`.

### `ActionWithFullId`

A `PluginAction` extended with `id` (full action ID) and `integration` (integration type).

### `OutputField`

```ts
type OutputField = {
  field: string;
  description: string;
};
```

### `OutputDisplayConfig`

```ts
type OutputDisplayConfig =
  | { type: "image" | "video" | "url"; field: string }
  | { type: "component"; component: React.ComponentType<ResultComponentProps> };
```

### `StepInput`

Base input type for step handlers. Extend this for your step's specific inputs.

### `NextWorkflowBuilderConfig`

```ts
type NextWorkflowBuilderConfig = {
  debug?: boolean;
  authOptions?: Record<string, unknown>;
};
```

---

## Built-in API routes

All routes are relative to the `/api` base path.

### Authentication

| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/auth/[...all]` | Better Auth handler (sign in, sign up, session, etc.) |
| GET/PATCH | `/user` | Get or update current user |

### Workflows

| Method | Path | Description |
| --- | --- | --- |
| GET | `/workflows` | List all workflows for the current user |
| POST | `/workflows/create` | Create a new workflow |
| GET/POST | `/workflows/current` | Get or set the current active workflow |
| GET | `/workflows/[id]` | Get a specific workflow |
| PATCH | `/workflows/[id]` | Update a workflow |
| DELETE | `/workflows/[id]` | Delete a workflow |
| POST | `/workflow/[id]/execute` | Execute a workflow |
| GET | `/workflow/[id]/cron` | Execute a workflow via Vercel Cron (requires `CRON_SECRET` bearer token) |
| POST | `/workflows/[id]/duplicate` | Duplicate a workflow |
| GET | `/workflows/[id]/code` | Get generated code for a workflow |
| GET | `/workflows/[id]/download` | Download workflow as a ZIP file |
| POST | `/workflows/[id]/webhook` | Trigger a workflow via webhook |
| GET/DELETE | `/workflows/[id]/executions` | List or clear workflow executions |

### Executions

| Method | Path | Description |
| --- | --- | --- |
| GET | `/workflows/executions/[executionId]/status` | Get execution status |
| GET | `/workflows/executions/[executionId]/logs` | Get execution logs |
| POST | `/workflows/executions/[executionId]/cancel` | Cancel a running execution |

### Integrations

| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/integrations` | List or create integrations |
| GET/PUT/DELETE | `/integrations/[id]` | Get, update, or delete an integration |
| POST | `/integrations/test` | Test integration credentials (before saving) |
| POST | `/integrations/[id]/test` | Test a saved integration's credentials |

### API Keys

| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/api-keys` | List or create API keys |
| DELETE | `/api-keys/[keyId]` | Delete an API key |
