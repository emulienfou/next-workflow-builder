# Plugins

Plugins are the extension system for next-workflow-builder. Each plugin adds an integration (e.g. Slack, GitHub, Stripe)
with its own credentials, actions, step handlers, and optionally custom API routes and UI components.

## How plugins work

1. Each plugin lives in its own directory under `plugins/` or is installed via npm
2. Plugins auto-register when imported by calling `registerIntegration()`
3. You manage `plugins/index.ts` — add import lines for each plugin (local or npm)
4. The `nwb discover-plugins` CLI imports `plugins/index.ts` and generates registry files
5. Generated files wire everything together: types, step imports, display configs, and codegen templates

## Plugin structure

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

## Auto-generated files

Running `nwb discover-plugins` generates these files in your consumer app:

| File | Description |
| --- | --- |
| `plugins/index.ts` | **User-managed.** Scaffolded once, then you edit it to add/remove plugin imports |
| `lib/types/integration.ts` | Union type of all integration type slugs |
| `lib/step-registry.ts` | Maps action IDs to lazy step import functions |
| `lib/output-display-configs.ts` | Maps action IDs to output display configurations |
| `lib/codegen-registry.ts` | Code generation templates for workflow export |
| `lib/route-registry.ts` | Custom API route definitions from plugins |

The `lib/` files are regenerated every time you run the discovery script. Do not edit them manually.
`plugins/index.ts` is scaffolded once and then managed by you — edit it to add or remove plugins.

## Using plugins

### Installing a local plugin

1. Copy the plugin directory into your `plugins/` folder
2. Add an import line to `plugins/index.ts`:
   ```ts
   import "./my-plugin";
   ```
3. Run `pnpm discover-plugins` (or it runs automatically on build)

### Installing an npm plugin

1. Install the package:
   ```bash
   pnpm add @next-workflow-builder/loop
   ```
2. Add an import line to `plugins/index.ts`:
   ```ts
   import "@next-workflow-builder/loop";
   ```
3. Run `pnpm discover-plugins` (or it runs automatically on build)

### Plugin discovery in your build

The example app runs discovery automatically before `dev` and `build`:

```json
{
  "scripts": {
    "dev": "nwb discover-plugins && next dev",
    "build": "nwb discover-plugins && next build"
  }
}
```

## Config field types

Plugins define config fields for their actions. These control the UI shown when configuring a workflow node.

| Type | Description |
| --- | --- |
| `text` | Plain text input |
| `password` | Password/secret input (masked) |
| `number` | Number input with optional `min` value |
| `select` | Dropdown select (requires `options` array) |
| `template-input` | Text input with `{{variable}}` template support |
| `template-textarea` | Textarea with `{{variable}}` template support |
| `schema-builder` | Visual schema builder for structured output |
| `group` | Groups related fields in a collapsible section |

### Conditional fields

Fields support conditional rendering with `showWhen`:

```ts
{
  key: "schema",
  label: "Output Schema",
  type: "schema-builder",
  showWhen: { field: "format", equals: "object" },
}
```

### Field groups

Group related fields in collapsible sections:

```ts
{
  label: "Advanced Options",
  type: "group",
  defaultExpanded: false,
  fields: [
    { key: "timeout", label: "Timeout (ms)", type: "number" },
    { key: "retries", label: "Max Retries", type: "number" },
  ],
}
```

## Output fields and templates

Actions declare their output fields, which become available as `{{NodeName.field}}` template variables in downstream
nodes:

```ts
actions: [
  {
    slug: "scrape",
    label: "Scrape URL",
    outputFields: [
      { field: "markdown", description: "Scraped content as markdown" },
      { field: "metadata", description: "Page metadata object" },
    ],
    // ...
  },
];
```

Downstream nodes can reference these outputs using template syntax:

```
{{ScrapeURL.markdown}}
```

## Output display configuration

Actions can specify how their output is displayed in the workflow execution panel:

```ts
{
  slug: "generate-image",
  outputConfig: {
    type: "image",     // "image" | "video" | "url" | "component"
    field: "imageUrl", // Field in step output containing the value
  },
}
```

For custom rendering, use a React component:

```ts
{
  outputConfig: {
    type: "component",
    component: MyResultComponent,
  },
}
```

## Next steps

- [Creating Plugins](/docs/creating-plugins) - Build your own plugin from scratch
- [API Reference](/docs/api-reference) - Plugin registry functions and types
