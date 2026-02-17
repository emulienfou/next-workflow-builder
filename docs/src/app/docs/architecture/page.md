# Architecture

## Project structure

```
packages/next-workflow-builder/
└── src/
    ├── client/                 # React components and hooks
    │   ├── components/
    │   │   ├── ai-elements/    # Canvas, node, edge, controls
    │   │   ├── auth/           # Auth dialog
    │   │   ├── overlays/       # Connection, configuration, settings
    │   │   ├── pages/          # HomePage, WorkflowPage, WorkflowsRedirect
    │   │   ├── settings/       # Account and integrations manager
    │   │   ├── ui/             # Radix UI primitives (button, dialog, etc.)
    │   │   ├── workflow/       # Editor, canvas, nodes, toolbar
    │   │   └── index.ts
    │   └── hooks/              # Custom React hooks
    │
    ├── server/                 # Server-side code
    │   ├── api/
    │   │   ├── handlers/       # Route handler implementations
    │   │   ├── routes.ts       # Route definitions
    │   │   ├── workflows.ts    # API handler factory
    │   │   └── handler-utils.ts
    │   ├── db/
    │   │   ├── schema.ts       # Drizzle ORM schema
    │   │   └── migrate.ts
    │   ├── plugin.ts           # Next.js plugin configuration
    │   └── index.ts
    │
    ├── lib/                    # Shared utilities
    │   ├── codegen-templates/  # Code generation templates
    │   ├── db/                 # Database utilities + schema
    │   ├── steps/              # Built-in step handlers
    │   ├── types/              # TypeScript type definitions
    │   ├── atoms/              # Jotai state atoms
    │   ├── api-client.ts       # Client-side API helper
    │   ├── workflow-store.ts   # Workflow Jotai state
    │   ├── workflow-codegen.ts # Code generation engine
    │   └── credential-fetcher.ts
    │
    ├── plugins/                # Plugin system
    │   ├── index.ts            # Public exports
    │   ├── registry.ts         # Integration registry
    │   └── legacy-mappings.ts
    │
    ├── scripts/                # CLI tools
    │   ├── nwb.ts              # CLI entry point
    │   ├── discover-plugins.ts # Plugin auto-discovery
    │   ├── create-plugin.ts    # Plugin scaffolding
    │   └── migrate-prod.ts     # Production migrations
    │
    └── styles/
        └── globals.css
```

## Consumer app structure

A typical consumer app using next-workflow-builder:

```
my-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with LayoutProvider
│   │   ├── [[...slug]]/page.tsx    # Catch-all workflow pages
│   │   └── api/[...slug]/route.ts  # Catch-all API handler
│   └── lib/                        # (auto-generated)
│       ├── types/integration.ts
│       ├── step-registry.ts
│       ├── codegen-registry.ts
│       ├── output-display-configs.ts
│       └── route-registry.ts
├── plugins/
│   ├── index.ts                    # (user-managed, scaffolded once)
│   ├── slack/
│   ├── github/
│   └── stripe/
└── next.config.ts
```

## Plugin registry

The plugin system is built around a central `Map<IntegrationType, IntegrationPlugin>` registry.

### Registration flow

1. Each plugin calls `registerIntegration(plugin)` in its `index.ts`
2. You import each plugin in the user-managed `plugins/index.ts` (local imports or npm packages)
3. The `nwb discover-plugins` script imports `plugins/index.ts` to populate the registry
4. Generated files provide the glue between the registry and the runtime:
   - **Step registry** maps `actionId -> () => import("plugin/steps/action")`
   - **Type union** ensures type safety for integration slugs
   - **Display configs** and **codegen templates** are registered at import time

### ESM dual module instance

A key architectural detail: consumer plugins import from `"next-workflow-builder/plugins"` (the package specifier),
while the discover script imports from a relative path. Node.js ESM caches modules by resolved URL, which can create
two separate module instances with separate registries.

The discover script handles this by explicitly re-registering each plugin's `default` export with the local registry
instance after import.

## API routing

The API handler uses a custom route matcher instead of Next.js file-based routing. All API requests go through a single
`/api/[...slug]/route.ts` catch-all handler.

Routes are defined declaratively in `routes.ts`:

```ts
const routes: RouteDefinition[] = [
  { path: "/workflows", handler: listWorkflows, methods: ["GET"] },
  { path: "/workflows/[workflowId]", handler: workflowCrud, methods: ["GET", "PATCH", "DELETE"] },
  // ...
];
```

The route matcher supports:
- Exact segments (`/workflows/create`)
- Dynamic segments (`/workflows/[workflowId]`)
- Catch-all segments (`/auth/[...all]`)

Plugin routes are merged with core routes at handler creation time.

## State management

Client-side state is managed with [Jotai](https://jotai.org/):

- **Workflow store** (`workflow-store.ts`) - Nodes, edges, and workflow metadata atoms
- **Atoms directory** (`atoms/`) - Additional state for UI, auth, integrations

The `LayoutProvider` wraps the app in a Jotai `Provider` to make atoms available throughout the component tree.

## Code generation

The workflow codegen system converts a visual workflow into standalone TypeScript code:

1. Reads the workflow's nodes and edges
2. Resolves each action node's codegen template from the registry
3. Generates a complete file with imports, step functions, and execution flow
4. Available as a download (ZIP) or in-editor code view

Templates can be:
- Auto-generated from step files that export `_exportCore`
- Custom templates defined in the plugin's `codegenTemplate` field
- Registered via the consumer's `lib/codegen-registry.ts`

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Radix UI, Tailwind CSS |
| Canvas | React Flow (@xyflow/react) |
| State | Jotai |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| AI | Vercel AI SDK |
| Animations | Motion (Framer Motion) |
| Build | TypeScript, Turborepo |
