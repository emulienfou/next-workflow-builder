# next-workflow-builder

A Next.js plugin for building visual workflow automation platforms with drag-and-drop editing, code generation, and AI-powered automation.

> **Full documentation available at [next-workflow-builder.vercel.app](https://next-workflow-builder.vercel.app)**

## Features

- Visual drag-and-drop workflow editor powered by React Flow
- Code generation — export workflows as TypeScript
- AI-powered workflow creation from natural language
- Real-time execution tracking and logs
- Extensible plugin system for third-party integrations
- Built-in authentication via Better Auth
- Dark / light / system theme support

## Requirements

- Node.js >= 22
- Next.js >= 16
- React >= 19
- PostgreSQL database

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
import type { NextConfig } from "next";
import nextWorkflowBuilder from "next-workflow-builder";

const withNextWorkflowBuilder = nextWorkflowBuilder({
  // debug: true,
  // authOptions: { ... }
});

export default withNextWorkflowBuilder({
  // Regular Next.js options
} satisfies NextConfig);
```

### 3. Create the API route

```ts
// app/api/[[...slug]]/route.ts
export { GET, POST, PUT, PATCH, DELETE, OPTIONS } from "next-workflow-builder/api";
```

### 4. Add the layout

```tsx
// app/layout.tsx
import { Layout } from "next-workflow-builder/client";
import "next-workflow-builder/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
```

### 5. Add the workflow pages

```tsx
// app/[[...slug]]/page.tsx
export { WorkflowPage as default } from "next-workflow-builder/client";
export { generateWorkflowMetadata as generateMetadata } from "next-workflow-builder/server";
```

### 6. Set environment variables

Create a `.env.local` file:

```env
DATABASE_URL=postgres://user:password@localhost:5432/workflow
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
INTEGRATION_ENCRYPTION_KEY=your-encryption-key
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret key for session encryption |
| `BETTER_AUTH_URL` | Yes | Base URL for auth callbacks |
| `INTEGRATION_ENCRYPTION_KEY` | Yes | Key to encrypt stored credentials |

### 7. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the workflow builder.

## Package Exports

| Import path | Description |
| --- | --- |
| `next-workflow-builder` | Next.js plugin — `nextWorkflowBuilder()` |
| `next-workflow-builder/client` | React components — `Layout`, `WorkflowPage`, `WorkflowEditor` |
| `next-workflow-builder/server` | Server utilities — `auth`, `db`, credentials, logging |
| `next-workflow-builder/api` | HTTP handlers — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` |
| `next-workflow-builder/plugins` | Plugin registry — `registerIntegration()`, query helpers |
| `next-workflow-builder/server/db/schema` | Drizzle ORM schema exports |
| `next-workflow-builder/styles.css` | Required CSS styles |

## Plugin System

Extend the workflow builder with custom integrations. Each plugin can provide triggers, actions, credentials configuration, and custom UI components.

```bash
# Scaffold a new plugin
npx nwb create-plugin

# Discover and register plugins
npx nwb discover-plugins
```

See the [Plugins documentation](https://next-workflow-builder.vercel.app/docs/plugins) for details.

## CLI Commands

| Command | Description |
| --- | --- |
| `nwb create-plugin` | Scaffold a new plugin interactively |
| `nwb discover-plugins` | Scan and register all plugins |
| `nwb migrate-prod` | Run database migrations for production |

## Documentation

For full documentation including configuration, authentication, database setup, deployment, and plugin development:

**[https://next-workflow-builder.vercel.app](https://next-workflow-builder.vercel.app)**

- [Getting Started](https://next-workflow-builder.vercel.app/docs/getting-started)
- [Configuration](https://next-workflow-builder.vercel.app/docs/configuration)
- [Plugins](https://next-workflow-builder.vercel.app/docs/plugins)
- [Creating Plugins](https://next-workflow-builder.vercel.app/docs/creating-plugins)
- [API Reference](https://next-workflow-builder.vercel.app/docs/api-reference)
- [CLI Reference](https://next-workflow-builder.vercel.app/docs/cli-reference)
- [Database](https://next-workflow-builder.vercel.app/docs/database)
- [Deployment](https://next-workflow-builder.vercel.app/docs/deployment)

## License

Apache-2.0
