# Plugins

Plugins add integrations and actions to the workflow builder. Each plugin lives in its own directory under `plugins/` and is auto-discovered by the `discover-plugins` script.

## Plugin Structure

```
plugins/
  {plugin-name}/
    index.ts          # Plugin definition + auto-registration (required)
    icon.tsx          # SVG icon component (required)
    credentials.ts    # Credential type definition (required)
    test.ts           # Connection test function (recommended)
    steps/            # Step handler functions (one per action)
      {action-slug}.ts
    routes/           # Custom API route handlers (optional)
      {route-name}.ts
    components/       # Custom UI components (optional)
    lib/              # Shared utilities (optional)
    client.ts         # Client-side setup / side effects (optional)
```

### Required Files

**`index.ts`** - Defines and registers the plugin:

```ts
import type { IntegrationPlugin } from "next-workflow-builder/plugins";
import { registerIntegration } from "next-workflow-builder/plugins";
import { MyIcon } from "./icon";

const myPlugin: IntegrationPlugin = {
  type: "my-service",          // Unique integration type slug
  label: "My Service",         // Display name
  description: "What it does", // Shown in the connection picker

  icon: MyIcon,

  // Credential fields shown when adding a connection
  formFields: [
    {
      id: "apiKey",
      label: "API Key",
      type: "password",            // "text" | "password" | "url"
      placeholder: "sk-...",
      configKey: "apiKey",         // Key stored in the integration config
      envVar: "MY_SERVICE_KEY",    // Env var name for code generation
      helpText: "Get your key from ",
      helpLink: { text: "my-service.com", url: "https://my-service.com/keys" },
    },
  ],

  // Optional: lazy-loaded connection test
  testConfig: {
    getTestFunction: async () => {
      const { testMyService } = await import("./test");
      return testMyService;
    },
  },

  // Actions this plugin provides
  actions: [
    {
      slug: "do-thing",                // Unique within this plugin
      label: "Do Thing",               // Display name
      description: "Does a thing",
      category: "My Service",          // Groups actions in the UI
      stepFunction: "doThingStep",     // Exported function name in the step file
      stepImportPath: "do-thing",      // File name under steps/ (no extension)
      configFields: [
        {
          key: "input",
          label: "Input",
          type: "template-textarea",   // Supports {{NodeName.field}} syntax
          placeholder: "Enter input...",
          rows: 4,
          required: true,
        },
      ],
      outputFields: [                  // Available for downstream {{}} references
        { field: "result", description: "The output result" },
      ],
    },
  ],
};

// Auto-register on import
registerIntegration(myPlugin);

export default myPlugin;
```

**`icon.tsx`** - SVG icon component:

```tsx
export function MyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {/* SVG paths */}
    </svg>
  );
}
```

**`credentials.ts`** - Type for the credential env vars:

```ts
export type MyServiceCredentials = {
  MY_SERVICE_KEY?: string;
};
```

### Step Files

Each action needs a step file under `steps/`. Steps run server-side during workflow execution.

```ts
// steps/do-thing.ts
import "server-only";
import {
  fetchCredentials,
  getErrorMessage,
  type StepInput,
  withStepLogging,
} from "next-workflow-builder/plugins";
import type { MyServiceCredentials } from "../credentials";

type DoThingResult =
  | { success: true; result: string }
  | { success: false; error: string };

export type DoThingInput = StepInput & {
  input: string;
  integrationId?: string;
};

async function stepHandler(
  input: { input: string },
  credentials: MyServiceCredentials,
): Promise<DoThingResult> {
  const apiKey = credentials.MY_SERVICE_KEY;
  if (!apiKey) {
    return { success: false, error: "MY_SERVICE_KEY is not configured." };
  }

  try {
    // Call your service API using fetch
    const response = await fetch("https://api.my-service.com/do-thing", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ input: input.input }),
    });

    const data = await response.json();
    return { success: true, result: data.result };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function doThingStep(input: DoThingInput): Promise<DoThingResult> {
  "use step";

  const credentials = input.integrationId
    ? await fetchCredentials(input.integrationId)
    : {};

  return withStepLogging(input, () => stepHandler(input, credentials));
}

doThingStep.maxRetries = 0;

export const _integrationType = "my-service";
```

### Test File

Validates credentials when a user clicks "Test" in the connection dialog:

```ts
// test.ts
export async function testMyService(credentials: Record<string, string>) {
  const apiKey = credentials.MY_SERVICE_KEY;
  if (!apiKey) {
    return { success: false, error: "MY_SERVICE_KEY is required" };
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

## Creating a New Plugin

1. Create a directory under `plugins/` with your integration slug (e.g. `plugins/my-service/`)
2. Add the required files: `index.ts`, `icon.tsx`, `credentials.ts`
3. Add step files under `steps/` for each action
4. Optionally add `test.ts` for connection testing
5. Run the discovery script to generate types and registries:

```bash
pnpm discover-plugins
```

This generates/updates:
- `plugins/index.ts` - Imports all discovered plugins
- `lib/types/integration.ts` - Union type of all integration slugs
- `lib/step-registry.ts` - Maps action IDs to step import functions
- `lib/output-display-configs.ts` - Maps action IDs to display configs
- `lib/codegen-registry.ts` - Code generation templates

## Config Field Types

| Type                 | Description                                       |
| -------------------- | ------------------------------------------------- |
| `text`               | Plain text input                                  |
| `password`           | Password/secret input                             |
| `number`             | Number input                                      |
| `select`             | Dropdown (requires `options` array)               |
| `template-input`     | Text input with `{{variable}}` template support   |
| `template-textarea`  | Textarea with `{{variable}}` template support     |
| `schema-builder`     | Visual schema builder for structured output       |

Fields support `showWhen` for conditional rendering:

```ts
{
  key: "schema",
  label: "Schema",
  type: "schema-builder",
  showWhen: { field: "format", equals: "object" },
}
```

## Guidelines

- Prefer `fetch` over SDK dependencies to reduce supply chain attack surface
- Step files must import `"server-only"` to prevent client bundling
- Use `withStepLogging` to wrap step execution for run history tracking
- The `"use step"` directive marks the function as a workflow step entry point
- Each step should export `_integrationType` for the codegen system
