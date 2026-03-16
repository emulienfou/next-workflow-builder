# Components

Client-side components are exported from `next-workflow-builder/client`.

```ts
import {
  Layout,
  WorkflowPage,
  WorkflowEditor,
} from "next-workflow-builder/client";
```

## Layout

The root wrapper component. Provides theme support (via `next-themes`), Jotai state management,
authentication context, and the persistent workflow canvas.

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

**Important:** You must also import the stylesheet (`next-workflow-builder/styles.css`) in your
layout for the UI to render correctly.

### Social auth providers

If you've configured social auth providers in your `next.config.ts`, pass them to the `Layout` component:

```tsx
<Layout social={{ providers: ["vercel"] }}>
  {children}
</Layout>
```

The `Layout` component accepts all props from Better Auth UI's `AuthUIProviderProps` (except `authClient`, which is provided automatically).

### Canvas options

Configure the workflow canvas via the `canvas` prop:

```tsx
<Layout
  canvas={{
    snapToGrid: true,        // Snap nodes to grid (default: true)
    edgeStyle: "smoothstep",  // "smoothstep" | "bezier" (default: "smoothstep")
  }}
>
  {children}
</Layout>
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `snapToGrid` | `boolean` | `true` | Align nodes to the background grid when dragging |
| `edgeStyle` | `"smoothstep" \| "bezier"` | `"smoothstep"` | Edge rendering style — smooth step produces angular connections, bezier produces curved connections |

## WorkflowPage

A catch-all page component that handles routing for the workflow builder:

```tsx
// app/[[...slug]]/page.tsx
export { WorkflowPage as default } from "next-workflow-builder/client";
export { generateWorkflowMetadata as generateMetadata } from "next-workflow-builder/server";
```

Routes handled:

| Path | Component | Description |
| --- | --- | --- |
| `/` | `HomePage` | New workflow landing page with placeholder canvas |
| `/workflows` | `WorkflowsRedirect` | Redirects to the most recently updated workflow |
| `/workflows/[id]` | `WorkflowEditor` | Full workflow editor for a specific workflow |

The `generateWorkflowMetadata` export from `next-workflow-builder/server` provides dynamic metadata
(title, description, Open Graph) for workflow pages.

## WorkflowEditor

The main workflow editor component with the drag-and-drop canvas, node configuration panel, toolbar, and execution panel.

```tsx
import { WorkflowEditor } from "next-workflow-builder/client";
```
