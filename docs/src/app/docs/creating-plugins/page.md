# Creating Plugins

This guide walks through building a complete integration plugin from scratch.

## Scaffolding

Use the CLI to generate a plugin skeleton:

```bash
npx nwb create-plugin
```

This creates a new directory under `plugins/` with all required files.

Alternatively, create the files manually following the structure below.

## Required files

### index.ts - Plugin definition

The main file defines the plugin and registers it:

```ts
import type { IntegrationPlugin } from "next-workflow-builder/plugins";
import { registerIntegration } from "next-workflow-builder/plugins";
import { MyServiceIcon } from "./icon";

const myServicePlugin: IntegrationPlugin = {
  type: "my-service",
  label: "My Service",
  description: "Connect to My Service API",

  icon: MyServiceIcon,

  formFields: [
    {
      id: "apiKey",
      label: "API Key",
      type: "password",
      placeholder: "sk-...",
      configKey: "apiKey",
      envVar: "MY_SERVICE_API_KEY",
      helpText: "Get your key from ",
      helpLink: {
        text: "my-service.com",
        url: "https://my-service.com/keys",
      },
    },
  ],

  testConfig: {
    getTestFunction: async () => {
      const { testMyService } = await import("./test");
      return testMyService;
    },
  },

  actions: [
    {
      slug: "do-thing",
      label: "Do Thing",
      description: "Performs an action via My Service",
      category: "My Service",
      stepFunction: "doThingStep",
      stepImportPath: "do-thing",
      configFields: [
        {
          key: "input",
          label: "Input",
          type: "template-textarea",
          placeholder: "Enter input or use {{NodeName.field}}...",
          rows: 4,
          required: true,
        },
      ],
      outputFields: [
        { field: "result", description: "The output result" },
      ],
    },
  ],
};

registerIntegration(myServicePlugin);

export default myServicePlugin;
```

### Plugin definition fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `string` | Yes | Unique integration type slug (e.g. `"my-service"`) |
| `label` | `string` | Yes | Display name shown in the UI |
| `description` | `string` | Yes | Short description for the connection picker |
| `icon` | `React.ComponentType` | Yes | SVG icon component |
| `formFields` | `FormField[]` | Yes | Credential fields shown when adding a connection |
| `testConfig` | `object` | No | Lazy-loaded connection test function |
| `actions` | `PluginAction[]` | Yes | Actions this plugin provides |
| `routes` | `RouteMetadata[]` | No | Custom API route definitions |
| `dependencies` | `Record<string, string>` | No | NPM dependencies for code generation |

### Action definition fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `slug` | `string` | Yes | Unique action slug within this plugin |
| `label` | `string` | Yes | Display name |
| `description` | `string` | Yes | What this action does |
| `category` | `string` | Yes | Category for UI grouping |
| `stepFunction` | `string` | Yes | Exported function name in the step file |
| `stepImportPath` | `string` | Yes | File name under `steps/` (no extension) |
| `configFields` | `ActionConfigField[]` | Yes | Configuration fields for this action |
| `outputFields` | `OutputField[]` | No | Output fields available for downstream templates |
| `outputConfig` | `OutputDisplayConfig` | No | How to display output in the runs panel |
| `codegenTemplate` | `string` | No | Custom code generation template |

### icon.tsx - SVG icon

```tsx
export function MyServiceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Your SVG paths */}
    </svg>
  );
}
```

### credentials.ts - Credential types

Define a type for the environment variables your plugin uses:

```ts
export type MyServiceCredentials = {
  MY_SERVICE_API_KEY?: string;
};
```

## Step files

Each action needs a corresponding step file under `steps/`. Steps run server-side during workflow execution.

### steps/do-thing.ts

```ts
import "server-only";
import {
  fetchCredentials,
  getErrorMessage,
  type StepInput,
  withStepLogging,
} from "next-workflow-builder/plugins";
import type { MyServiceCredentials } from "../credentials";

type DoThingResult = {
  result: string;
};

export type DoThingInput = StepInput & {
  input: string;
  integrationId?: string;
};

async function stepHandler(
  input: { input: string },
  credentials: MyServiceCredentials
): Promise<DoThingResult> {
  const apiKey = credentials.MY_SERVICE_API_KEY;
  if (!apiKey) {
    throw new Error("MY_SERVICE_API_KEY is not configured.");
  }

  const response = await fetch("https://api.my-service.com/do-thing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: input.input }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return { result: data.result };
}

export async function doThingStep(
  input: DoThingInput
): Promise<DoThingResult> {
  "use step";

  const credentials = input.integrationId
    ? await fetchCredentials(input.integrationId)
    : {};

  return withStepLogging(input, () => stepHandler(input, credentials));
}

doThingStep.maxRetries = 0;

export const _integrationType = "my-service";
```

### Step file conventions

- **Always import `"server-only"`** to prevent client bundling
- **Use `"use step"` directive** to mark the function as a workflow step entry point
- **Wrap with `withStepLogging`** for execution history tracking
- **Export `_integrationType`** for the codegen system
- **Set `maxRetries`** on the step function (typically `0`)
- **Separate `stepHandler`** from the exported entry point for portability
- **Prefer `fetch` over SDK dependencies** to reduce supply chain attack surface

## Connection test

The test file validates credentials when a user clicks "Test" in the connection dialog:

### test.ts

```ts
export async function testMyService(
  credentials: Record<string, string>
) {
  const apiKey = credentials.MY_SERVICE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "MY_SERVICE_API_KEY is required" };
  }

  try {
    const response = await fetch("https://api.my-service.com/ping", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

The test function is lazy-loaded via `testConfig.getTestFunction` to avoid bundling server-only code on the client.

## Custom API routes

Plugins can define custom API route handlers:

### index.ts (routes section)

```ts
const myPlugin: IntegrationPlugin = {
  // ...
  routes: [
    {
      path: "/my-service/webhook",
      methods: ["POST"],
      handler: "myServiceWebhook",
      handlerImportPath: "routes/webhook",
    },
  ],
};
```

### routes/webhook.ts

```ts
import type { RouteHandler } from "next-workflow-builder";

export const myServiceWebhook: RouteHandler = async (route, ctx) => {
  const body = await route.request.json();
  // Handle webhook...
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
```

Plugin routes are auto-discovered and registered in `lib/route-registry.ts` when you run `nwb discover-plugins`.

## Register and discover

After creating your plugin files:

1. Add an import to `plugins/index.ts`:
   ```ts
   import "./my-service";
   ```

2. Run the discovery script to regenerate registry files:
   ```bash
   npx nwb discover-plugins
   ```

The discovery script imports `plugins/index.ts` to populate the registry, then generates type definitions, step registry, display configs, codegen templates, and route registry.

## Complete example

See the [Firecrawl plugin](https://github.com) in the example app for a complete reference implementation with
multiple actions, connection testing, and step handlers.
