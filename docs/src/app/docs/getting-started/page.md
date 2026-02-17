# Getting Started

Set up next-workflow-builder in a new or existing Next.js project.

## 1. Install

```bash
npm install next-workflow-builder
# or
pnpm add next-workflow-builder
```

You also need these peer dependencies:

```bash
pnpm add tsx workflow
```

## 2. Configure Next.js

Wrap your Next.js config with the workflow builder plugin:

```ts
// next.config.ts
import workflowBuilder from "next-workflow-builder";

const withWorkflowBuilder = workflowBuilder({
  theme: "system", // 'light' | 'dark' | 'system'
});

const nextConfig = withWorkflowBuilder({
  // Your regular Next.js options here
});

export default nextConfig;
```

## 3. Create the API route

Create a catch-all API route to handle all workflow requests (auth, CRUD, execution, integrations):

```ts
// src/app/api/[...slug]/route.ts
import { createWorkflowApiHandler } from "next-workflow-builder";

const handler = createWorkflowApiHandler({});

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};
```

The handler reads the database URL from the `NEXT_WORKFLOW_BUILDER_DATABASE_URL` environment variable.

## 4. Add the layout provider

Wrap your app with `LayoutProvider` to enable theme support, state management, auth, and the persistent workflow canvas:

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
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}
```

## 5. Add the workflow pages

Use the catch-all `WorkflowPage` component to handle all workflow routes:

```tsx
// src/app/[[...slug]]/page.tsx
export { WorkflowPage as default } from "next-workflow-builder/components";
```

This single file handles three routes:

| Path | Behavior |
| --- | --- |
| `/` | New workflow homepage with a placeholder canvas |
| `/workflows` | Redirects to the most recently updated workflow |
| `/workflows/[id]` | Opens the workflow editor for a specific workflow |

## 6. Set environment variables

Create a `.env.local` file:

```env
NEXT_WORKFLOW_BUILDER_DATABASE_URL=postgres://user:password@localhost:5432/workflow
BETTER_AUTH_URL=http://localhost:3000
```

## 7. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the workflow builder.

## Next steps

- [Configuration](/docs/configuration) - Customize theme, API route, AI settings, and more
- [Plugins](/docs/plugins) - Add integrations like Slack, GitHub, Stripe
- [Database](/docs/database) - Set up and migrate your PostgreSQL schema
