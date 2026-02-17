# Components

All React components are exported from `next-workflow-builder/components`.

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

## LayoutProvider

The root provider component. Wraps your app with theme support (via `next-themes`), Jotai state management,
authentication context, and the persistent workflow canvas.

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

**Important:** You must also import the global CSS stylesheet (`next-workflow-builder/styles/globals.css`) in your
layout for the UI to render correctly.

## WorkflowPage

A catch-all page component that handles routing for the workflow builder:

```tsx
// src/app/[[...slug]]/page.tsx
export { WorkflowPage as default } from "next-workflow-builder/components";
```

Routes handled:

| Path | Component | Description |
| --- | --- | --- |
| `/` | `HomePage` | New workflow landing page with placeholder canvas |
| `/workflows` | `WorkflowsRedirect` | Redirects to the most recently updated workflow |
| `/workflows/[id]` | `WorkflowEditor` | Full workflow editor for a specific workflow |

## HomePage

The landing page component. Displays a placeholder canvas for creating new workflows.

```tsx
import { HomePage } from "next-workflow-builder/components";
```

## WorkflowEditor

The main workflow editor component with the drag-and-drop canvas, node configuration panel, toolbar, and execution panel.

```tsx
import { WorkflowEditor } from "next-workflow-builder/components";
```

## WorkflowsRedirect

A component that fetches the most recently updated workflow and redirects to its editor page.

```tsx
import { WorkflowsRedirect } from "next-workflow-builder/components";
```

## PersistentCanvas

The React Flow canvas component that persists across navigation. Manages nodes, edges, and the visual workflow graph.

```tsx
import { PersistentCanvas } from "next-workflow-builder/components";
```

## Client utilities

### API client

```ts
import { api } from "next-workflow-builder/lib/api-client";
```

The `api` object provides typed methods for all workflow API endpoints.

### Workflow store

```ts
import { nodesAtom, edgesAtom } from "next-workflow-builder/lib/workflow-store";
```

Jotai atoms for the workflow editor state. Use these to read or manipulate the current workflow's nodes and edges
from custom components.

## Hooks

```ts
import { /* hooks */ } from "next-workflow-builder/hooks";
```

Custom React hooks for interacting with the workflow builder state, authentication, and integrations.
