# API Reference

## Package exports

The package provides several entry points:

| Import path | Description |
| --- | --- |
| `next-workflow-builder` | Server-side: Next.js plugin, API handler, schema, utilities |
| `next-workflow-builder/components` | React components: LayoutProvider, WorkflowPage, etc. |
| `next-workflow-builder/hooks` | Custom React hooks |
| `next-workflow-builder/plugins` | Plugin system: registration, types, step utilities |
| `next-workflow-builder/styles/globals.css` | Required CSS styles |
| `next-workflow-builder/lib/api-client` | Client-side API helper |
| `next-workflow-builder/lib/workflow-store` | Jotai workflow state atoms |

---

## Server exports (`next-workflow-builder`)

```ts
import workflowBuilder, {
  createWorkflowApiHandler,
  schema,
  encrypt,
  decrypt,
  generateId,
  errorResponse,
  jsonResponse,
  requireSession,
  eq, and, or, sql, inArray, notInArray, isNull, isNotNull, desc, asc,
} from "next-workflow-builder";
```

### `workflowBuilder(config?)`

The default export. Returns a function that wraps your Next.js config.

```ts
const withWorkflowBuilder = workflowBuilder({ theme: "dark" });
const nextConfig = withWorkflowBuilder({ /* next config */ });
```

**Parameters:** `WorkflowConfig` (see [Configuration](/docs/configuration))
**Returns:** `(nextConfig: NextConfig) => NextConfig`

### `createWorkflowApiHandler(options?)`

Creates a catch-all API route handler for all workflow endpoints.

```ts
const handler = createWorkflowApiHandler({
  pluginRoutes: [],
  authOptions: { /* Better Auth options */ },
});
```

**Parameters:** `WorkflowApiHandlerOptions`
- `pluginRoutes?` - Array of `RouteDefinition` from plugins
- `authOptions?` - Better Auth configuration overrides

**Returns:** `(req: Request, ctx?: NextContext) => Promise<Response>`

### `schema`

Drizzle ORM schema namespace with all database tables. See [Database](/docs/database).

### `encrypt(text)` / `decrypt(text)`

Encrypt and decrypt integration credentials stored in the database.

### `generateId()`

Generate a unique nanoid-based identifier for database records.

### Drizzle query helpers

Re-exports from `drizzle-orm`: `eq`, `and`, `or`, `sql`, `inArray`, `notInArray`, `isNull`, `isNotNull`, `desc`, `asc`.

---

## Plugin exports (`next-workflow-builder/plugins`)

```ts
import {
  registerIntegration,
  registerCodegenTemplates,
  getCodegenTemplate,
  registerOutputDisplayConfigs,
  getOutputDisplayConfig,
  fetchCredentials,
  withStepLogging,
  getErrorMessage,
  getErrorMessageAsync,
  registerManagedConnectionProvider,
} from "next-workflow-builder/plugins";
```

### `registerIntegration(plugin)`

Register a plugin with the integration registry.

```ts
registerIntegration(myPlugin);
```

**Parameters:** `IntegrationPlugin` - The plugin definition object

### `fetchCredentials(integrationId)`

Fetch and decrypt credentials for an integration. Used in step handlers.

```ts
const credentials = await fetchCredentials(input.integrationId);
```

**Parameters:** `string` - Integration ID
**Returns:** `Promise<Record<string, string>>`

### `withStepLogging(input, fn)`

Wrap a step handler function with execution logging for the workflow runs panel.

```ts
return withStepLogging(input, () => stepHandler(input, credentials));
```

**Parameters:**
- `input` - `StepInput` object
- `fn` - `() => Promise<T>` - The step handler function

**Returns:** `Promise<T>`

### `getErrorMessage(error)` / `getErrorMessageAsync(error)`

Extract a human-readable error message from unknown error types.

### `registerCodegenTemplates(templates)`

Register code generation templates. Called from auto-generated `lib/codegen-registry.ts`.

### `registerOutputDisplayConfigs(configs)`

Register output display configurations. Called from auto-generated `lib/output-display-configs.ts`.

---

## Types

### `IntegrationPlugin`

Full plugin definition. See [Creating Plugins](/docs/creating-plugins) for field details.

### `PluginAction`

Action definition within a plugin.

### `ActionConfigField`

Config field definition. Can be `ActionConfigFieldBase` or `ActionConfigFieldGroup`.

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

### `StepImporter`

```ts
type StepImporter = () => Promise<Record<string, Function>>;
```

### `WorkflowConfig`

```ts
type WorkflowConfig = {
  theme?: "light" | "dark" | "system";
  apiRoute?: string;
  autoGenerateApiRoute?: boolean;
  dbImportPath?: string;
  authImportPath?: string;
  ai?: { provider?: "openai" | "anthropic"; model?: string };
};
```

### `RouteDefinition`

```ts
type RouteDefinition = {
  path: string;
  handler: RouteHandler;
  methods: string[];
};
```

### `RouteHandler`

```ts
type RouteHandler = (
  route: ParsedRoute,
  context: HandlerContext
) => Promise<Response>;
```

---

## Built-in API routes

All routes are relative to the `apiRoute` base path (default: `/api`).

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
| POST | `/workflows/[id]/execute` | Execute a workflow |
| POST | `/workflows/[id]/duplicate` | Duplicate a workflow |
| GET | `/workflows/[id]/code` | Get generated code for a workflow |
| GET | `/workflows/[id]/download` | Download workflow as a ZIP file |
| POST | `/workflows/[id]/webhook` | Trigger a workflow via webhook |
| GET | `/workflows/[id]/cron` | Execute a scheduled workflow |
| GET/DELETE | `/workflows/[id]/executions` | List or clear workflow executions |

### Executions

| Method | Path | Description |
| --- | --- | --- |
| GET | `/workflows/executions/[executionId]/status` | Get execution status |
| GET | `/workflows/executions/[executionId]/logs` | Get execution logs |

### Integrations

| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/integrations` | List or create integrations |
| GET/PUT/DELETE | `/integrations/[id]` | Get, update, or delete an integration |
| POST | `/integrations/test` | Test integration credentials (before saving) |
| POST | `/integrations/[id]/test` | Test a saved integration's credentials |

### AI

| Method | Path | Description |
| --- | --- | --- |
| POST | `/ai/generate` | Generate a workflow from a natural language prompt |

### API Keys

| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/api-keys` | List or create API keys |
| DELETE | `/api-keys/[keyId]` | Delete an API key |
