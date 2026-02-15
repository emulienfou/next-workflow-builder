# next-workflow-builder

A Next.js plugin for visual workflow building with drag-and-drop, code generation, and AI-powered automation.

Built with Next.js 16, React 19, Drizzle ORM, Better Auth, and React Flow.

## Features

- Visual drag-and-drop workflow editor
- Node-based workflow canvas with triggers, actions, and conditions
- AI-powered workflow generation
- Workflow execution with real-time status tracking
- Code generation from visual workflows
- Authentication via Better Auth
- Integration plugin system (Slack, GitHub, Linear, Stripe, Resend, and more)
- Dark/light/system theme support

## Quick Start

### 1. Install

```bash
npm install next-workflow-builder
# or
pnpm add next-workflow-builder
```

### 2. Configure Next.js

```ts
// next.config.ts
import workflowBuilder from "next-workflow-builder";

// Set up WorkflowBuilder with its configuration
const withWorkflowBuilder = workflowBuilder({
  // ... Add WorkflowBuilder specific options here
});

// Export the final Next.js config with workflowBuilder included
const nextConfig = withWorkflowBuilder({
  // ... Add regular Next.js options here
});

export default nextConfig;
```

### 3. Create the API Route

Create a catch-all API route to handle all workflow API requests:

```ts
// src/app/api/[...slug]/route.ts
import { db } from "@/lib/db";
import { createWorkflowApiHandler } from "next-workflow-builder";

// Create the handler once
const handler = createWorkflowApiHandler({ db });

// Export the methods you strictly need (OPTIONS is usually auto-handled)
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
```

### 4. Set Up the Database

Create your database module with the schema exports that `next-workflow-builder` expects:

```ts
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  accounts,
  apiKeys,
  integrations,
  sessions,
  users,
  verifications,
  workflowExecutionLogs,
  workflowExecutions,
  workflowExecutionsRelations,
  workflows,
} from "./schema";

export const schema = {
  users,
  sessions,
  accounts,
  verifications,
  workflows,
  workflowExecutions,
  workflowExecutionLogs,
  workflowExecutionsRelations,
  apiKeys,
  integrations,
};

const connectionString =
  process.env.DATABASE_URL || "postgres://localhost:5432/workflow";

const queryClient = postgres(connectionString, { max: 10 });
export const db = drizzle(queryClient, { schema });
```

See [`example/src/lib/db/schema.ts`](example/src/lib/db/schema.ts) for the full Drizzle schema definition.

### 5. Set Up Authentication

```ts
// src/lib/auth.ts
import { db, schema } from "@/lib/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});
```

Create the auth API route:

```ts
// src/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

### 6. Add the Layout Provider

Wrap your app with `LayoutProvider` — it provides theme, state management, auth, and the persistent workflow canvas:

```tsx
// src/app/layout.tsx
import { LayoutProvider } from "next-workflow-builder/components";
import "next-workflow-builder/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body>
      <LayoutProvider>{ children }</LayoutProvider>
    </body>
    </html>
  );
}
```

### 7. Add the Workflow Pages

Use the catch-all `WorkflowPage` component to handle all workflow routes with a single file:

```tsx
// src/app/[[...slug]]/page.tsx
export { WorkflowPage as default } from "next-workflow-builder/components";
```

This handles three routes:

| Path              | Behavior                                          |
|-------------------|---------------------------------------------------|
| `/`               | New workflow homepage with placeholder canvas     |
| `/workflows`      | Redirects to the most recently updated workflow   |
| `/workflows/[id]` | Opens the workflow editor for a specific workflow |

### 8. Environment Variables

```env
DATABASE_URL=postgres://localhost:5432/workflow
BETTER_AUTH_URL=http://localhost:3000
```

## Plugin Configuration

```ts
workflowBuilder({
  theme: "dark",           // 'light' | 'dark' | 'system' (default: 'system')
  apiRoute: "/api/workflow", // API route base path (default: '/api/workflow')
  dbImportPath: "@/lib/db",  // Import path for db (default: '@/lib/db')
  authImportPath: "@/lib/auth", // Import path for auth (default: '@/lib/auth')
  databaseUrl: "...",       // Database connection string
  ai: {                     // AI generation config
    provider: "openai",     // 'openai' | 'anthropic'
    model: "gpt-4",
  },
  plugins: [],              // Enabled integration plugins
});
```

## Exports

### Server (`next-workflow-builder`)

```ts
import workflowBuilder, {
  createWorkflowApiHandler,
  createExecutionHandler,
  schema,
} from "next-workflow-builder";
```

### Components (`next-workflow-builder/components`)

```ts
import {
  LayoutProvider,
  WorkflowPage,
  WorkflowEditor,
  HomePage,
  WorkflowsRedirect,
  PersistentCanvas,
} from "next-workflow-builder/components";
```

### Client Utilities

```ts
import { api } from "next-workflow-builder/lib/api-client";
import { nodesAtom, edgesAtom } from "next-workflow-builder/lib/workflow-store";
```

## Project Structure

```
.
├── example/                    # Example Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with LayoutProvider
│   │   │   ├── [[...slug]]/    # Catch-all workflow pages
│   │   │   └── api/
│   │   │       ├── auth/       # Better Auth handler
│   │   │       └── [...slug]/  # Workflow API route
│   │   └── lib/
│   │       ├── auth.ts         # Better Auth setup
│   │       └── db/             # Drizzle ORM setup + schema
│   └── next.config.ts
│
└── packages/
    └── next-workflow-builder/  # The plugin package
        └── src/
            ├── client/         # React components, hooks
            ├── server/         # API handlers, plugin config, codegen
            ├── lib/            # Shared utilities, state, API client
            ├── plugins/        # Integration plugins
            └── styles/         # CSS
```

## License

Apache-2.0
