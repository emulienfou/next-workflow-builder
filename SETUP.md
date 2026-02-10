# next-workflow-builder

A reusable Next.js plugin package that wraps the [Vercel Workflow Builder Template](https://github.com/vercel-labs/workflow-builder-template) into an installable package, following the [Nextra](https://github.com/shuding/nextra/tree/main/packages/nextra) architecture pattern.

## Usage

```ts
// next.config.ts
import withWorkflow from 'next-workflow-builder';

const nextConfig = withWorkflow({
  theme: 'dark',
  apiRoute: '/api/workflow'
})({
  reactStrictMode: true,
});

export default nextConfig;
```

---

## Monorepo Structure

```text
.
├── apps/
│   └── web/                          # Example Next.js app (for dev/testing)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── globals.css
│       │   └── workflows/            # Demo workflow pages
│       ├── next.config.ts            # Uses withWorkflow()
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── workflow-builder/        # The reusable package
│       ├── src/
│       │   ├── server/               # Node-only (next.config, API handlers, DB)
│       │   │   ├── index.ts          # Server exports
│       │   │   ├── plugin.ts         # withWorkflow() HOC for next.config
│       │   │   ├── constants.ts
│       │   │   ├── api/              # API route handlers
│       │   │   │   ├── workflows.ts  # CRUD for workflows
│       │   │   │   ├── execute.ts    # Workflow execution engine
│       │   │   │   ├── ai-gateway.ts # AI integration proxy
│       │   │   │   └── ai-generate.ts
│       │   │   ├── db/               # Drizzle schema & migrations
│       │   │   │   ├── schema.ts
│       │   │   │   └── migrate.ts
│       │   │   └── utils.ts
│       │   │
│       │   ├── client/               # Browser-only ("use client")
│       │   │   ├── index.ts          # Client exports
│       │   │   ├── components/       # React components
│       │   │   │   ├── workflow/     # Core workflow UI
│       │   │   │   │   ├── workflow-canvas.tsx
│       │   │   │   │   ├── persistent-canvas.tsx
│       │   │   │   │   ├── node-config-panel.tsx
│       │   │   │   │   ├── workflow-context-menu.tsx
│       │   │   │   │   ├── workflow-runs.tsx
│       │   │   │   │   ├── workflow-toolbar.tsx
│       │   │   │   │   ├── config/   # Node configuration panels
│       │   │   │   │   ├── nodes/    # Custom node types
│       │   │   │   │   └── utils/    # Workflow-specific helpers
│       │   │   │   ├── ui/           # Shared UI primitives (shadcn-based)
│       │   │   │   │   ├── button.tsx
│       │   │   │   │   ├── dialog.tsx
│       │   │   │   │   ├── input.tsx
│       │   │   │   │   ├── select.tsx
│       │   │   │   │   ├── code-editor.tsx
│       │   │   │   │   ├── spinner.tsx
│       │   │   │   │   └── ...       # ~25 more shadcn primitives
│       │   │   │   ├── overlays/     # Modals, drawers, sheets
│       │   │   │   ├── settings/     # Settings panels
│       │   │   │   └── icons/        # Icon components
│       │   │   ├── hooks/            # Custom React hooks
│       │   │   │   ├── use-mobile.ts
│       │   │   │   └── use-touch.ts
│       │   │   └── hocs/             # Higher-order components
│       │   │
│       │   ├── plugins/              # Integration plugins (Slack, Linear, etc.)
│       │   │   ├── index.ts
│       │   │   ├── registry.ts       # Plugin discovery & registration
│       │   │   ├── legacy-mappings.ts
│       │   │   ├── _template/        # Template for custom plugins
│       │   │   ├── slack/
│       │   │   ├── linear/
│       │   │   ├── resend/
│       │   │   ├── github/
│       │   │   ├── stripe/
│       │   │   ├── ai-gateway/
│       │   │   ├── fal/
│       │   │   ├── firecrawl/
│       │   │   ├── clerk/
│       │   │   ├── blob/
│       │   │   ├── perplexity/
│       │   │   ├── superagent/
│       │   │   ├── v0/
│       │   │   └── webflow/
│       │   │
│       │   ├── lib/                  # Shared utilities (isomorphic)
│       │   │   ├── utils.ts
│       │   │   ├── constants.ts
│       │   │   ├── fonts.ts
│       │   │   ├── atoms/            # Jotai atoms (state management)
│       │   │   ├── workflow-store.ts
│       │   │   ├── workflow-codegen.ts
│       │   │   ├── workflow-codegen-sdk.ts
│       │   │   ├── workflow-codegen-shared.ts
│       │   │   ├── workflow-logging.ts
│       │   │   ├── workflow-executor.workflow.ts
│       │   │   ├── condition-validator.ts
│       │   │   ├── integrations-store.ts
│       │   │   ├── credential-fetcher.ts
│       │   │   ├── monaco-theme.ts
│       │   │   ├── codegen-templates/
│       │   │   ├── steps/
│       │   │   └── utils/
│       │   │
│       │   ├── styles/               # CSS
│       │   │   └── globals.css       # Tailwind + custom styles
│       │   │
│       │   ├── types.ts              # Shared type definitions
│       │   └── env.d.ts              # Environment type declarations
│       │
│       ├── styles/                   # Pre-built CSS (published)
│       │   └── globals.css
│       ├── package.json
│       ├── tsup.config.ts
│       ├── tsconfig.json
│       └── vitest.config.ts
│
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Package Configuration

### Root `package.json`

```json
{
  "name": "next-workflow-builder-monorepo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0"
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

### Package `package.json` (`packages/next-workflow-builder/package.json`)

Following Nextra's exports map pattern — separate entry points for server, client, components, hooks, and plugins.

```json
{
  "name": "next-workflow-builder",
  "version": "0.1.0",
  "type": "module",
  "license": "Apache-2.0",
  "description": "A reusable Next.js plugin for visual workflow building with drag-and-drop, code generation, and AI-powered automation.",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js",
      "require": "./dist/server/index.cjs"
    },
    "./components": {
      "types": "./dist/client/components/index.d.ts",
      "import": "./dist/client/components/index.js"
    },
    "./hooks": {
      "types": "./dist/client/hooks/index.d.ts",
      "import": "./dist/client/hooks/index.js"
    },
    "./plugins": {
      "types": "./dist/plugins/index.d.ts",
      "import": "./dist/plugins/index.js"
    },
    "./styles/globals.css": "./styles/globals.css",
    "./*": {
      "types": "./dist/client/*.d.ts",
      "import": "./dist/client/*.js"
    }
  },
  "files": [
    "dist",
    "styles"
  ],
  "scripts": {
    "build": "NODE_ENV=production tsup",
    "dev": "tsup --watch",
    "test": "vitest --typecheck",
    "types:check": "tsc --noEmit",
    "prepublishOnly": "pnpm build"
  },
  "peerDependencies": {
    "next": ">=14",
    "react": ">=18",
    "react-dom": ">=18"
  },
  "dependencies": {
    "@xyflow/react": "^12.0.0",
    "jotai": "^2.0.0",
    "motion": "^11.0.0",
    "zod": "^3.22.0",
    "nanoid": "^5.0.0",
    "lucide-react": "latest",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "drizzle-orm": "^0.36.0",
    "ai": "^4.0.0",
    "@ai-sdk/provider": "^1.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^2.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "@types/react": "^19.0.0"
  }
}
```

---

### Build Config (`packages/next-workflow-builder/tsup.config.ts`)

Mirrors Nextra's tsup setup — ESM format, client/server split, TypeScript declarations.

```ts
import { defineConfig } from 'tsup';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export default defineConfig({
  name: 'next-workflow-builder',
  entry: [
    'src/server/index.ts',
    'src/client/index.ts',
    'src/client/components/**/*.{ts,tsx}',
    'src/client/hooks/**/*.ts',
    'src/plugins/index.ts',
    'src/lib/**/*.ts',
    'src/types.ts',
  ],
  format: 'esm',
  dts: true,
  splitting: IS_PRODUCTION,
  clean: IS_PRODUCTION,
  bundle: false,
  external: [
    'react',
    'react-dom',
    'next',
    'shiki',
  ],
  async onSuccess() {
    // Write sideEffects: false for client tree-shaking
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const clientPkg = path.resolve('dist', 'client', 'package.json');
    await fs.writeFile(clientPkg, '{"sideEffects":false}');
  },
});
```

---

## Plugin Implementation

### `src/server/plugin.ts` — The `withWorkflow()` HOC

This is the core of the package — a curried function that takes workflow options, then Next.js config.

```ts
import type { NextConfig } from 'next';

export interface WorkflowConfig {
  /** UI theme: 'light' | 'dark' | 'system'. Default: 'system' */
  theme?: 'light' | 'dark' | 'system';
  /** Base route for workflow API handlers. Default: '/api/workflow' */
  apiRoute?: string;
  /** Database connection string (required for persistence) */
  databaseUrl?: string;
  /** Enable AI-powered workflow generation */
  ai?: {
    provider?: 'openai' | 'anthropic';
    model?: string;
  };
  /** Enabled integration plugins */
  plugins?: string[];
}

const defaultConfig: WorkflowConfig = {
  theme: 'system',
  apiRoute: '/api/workflow',
};

export default function withWorkflow(workflowConfig: WorkflowConfig = {}) {
  const resolvedConfig = { ...defaultConfig, ...workflowConfig };

  return (nextConfig: NextConfig = {}): NextConfig => ({
    ...nextConfig,
    transpilePackages: [
      ...(nextConfig.transpilePackages || []),
      'next-workflow-builder',
    ],
    env: {
      ...nextConfig.env,
      NEXT_WORKFLOW_THEME: resolvedConfig.theme,
      NEXT_WORKFLOW_API_ROUTE: resolvedConfig.apiRoute,
      ...(resolvedConfig.databaseUrl && {
        NEXT_WORKFLOW_DATABASE_URL: resolvedConfig.databaseUrl,
      }),
    },
    webpack(config, options) {
      // Alias workflow internals for proper resolution
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'next-workflow-builder/internal': require.resolve(
          'next-workflow-builder/dist/lib'
        ),
      };

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }
      return config;
    },
  });
}
```

### `src/server/index.ts` — Server Entry

```ts
export { default, type WorkflowConfig } from './plugin.js';
export { createWorkflowApiHandler } from './api/workflows.js';
export { createExecutionHandler } from './api/execute.js';
```

### `src/client/index.ts` — Client Entry

```ts
'use client';

export { WorkflowCanvas } from './components/workflow/workflow-canvas.js';
export { PersistentCanvas } from './components/workflow/persistent-canvas.js';
export { NodeConfigPanel } from './components/workflow/node-config-panel.js';
export { WorkflowToolbar } from './components/workflow/workflow-toolbar.js';
export { WorkflowContextMenu } from './components/workflow/workflow-context-menu.js';
export { WorkflowRuns } from './components/workflow/workflow-runs.js';

// Re-export hooks
export * from './hooks/use-mobile.js';
export * from './hooks/use-touch.js';
```

---

## Consumer Integration

### 1. Install

```bash
pnpm add next-workflow-builder
```

### 2. Configure `next.config.ts`

```ts
import withWorkflow from 'next-workflow-builder';

const nextConfig = withWorkflow({
  theme: 'dark',
  apiRoute: '/api/workflow',
})({
  reactStrictMode: true,
});

export default nextConfig;
```

### 3. Add API Route (`app/api/workflow/[...slug]/route.ts`)

```ts
import { createWorkflowApiHandler } from 'next-workflow-builder';

const handler = createWorkflowApiHandler();

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
```

### 4. Use Components

```tsx
import { WorkflowCanvas, WorkflowToolbar } from 'next-workflow-builder/components';

export default function WorkflowPage() {
  return (
    <div className="h-screen">
      <WorkflowToolbar />
      <WorkflowCanvas />
    </div>
  );
}
```

### 5. Tailwind Config

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './node_modules/next-workflow-builder/dist/**/*.{js,mjs}',
  ],
} satisfies Config;
```

---

## Implementation Plan

### Phase 1 — Scaffold

1. Initialize monorepo with pnpm workspaces + Turbo
2. Create `packages/next-workflow-builder` with tsup build
3. Implement `withWorkflow()` plugin (curried config pattern)
4. Set up `apps/web` example app consuming the package

### Phase 2 — Extract Components

5. Port workflow UI components from the Vercel template into `src/client/components/workflow/`
6. Port shadcn UI primitives into `src/client/components/ui/`
7. Port hooks into `src/client/hooks/`
8. Port Jotai atoms and stores into `src/lib/atoms/`

### Phase 3 — Extract Server Logic

9. Port API route handlers into `src/server/api/`
10. Port Drizzle schema into `src/server/db/`
11. Port workflow execution engine into `src/server/api/execute.ts`
12. Port AI gateway proxy into `src/server/api/ai-gateway.ts`

### Phase 4 — Plugin System

13. Port plugin registry and all integration plugins into `src/plugins/`
14. Implement plugin discovery based on `WorkflowConfig.plugins` array
15. Port code generation templates into `src/lib/codegen-templates/`

### Phase 5 — Polish

16. Write CSS bundle for `styles/globals.css`
17. Add Vitest tests
18. Add comprehensive TypeScript types and JSDoc
19. Publish to npm as `next-workflow-builder`
