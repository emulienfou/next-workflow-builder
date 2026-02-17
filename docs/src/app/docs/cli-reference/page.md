# CLI Reference

The `nwb` (Next Workflow Builder) CLI provides commands for plugin management and database operations.

## Installation

The CLI is included with the `next-workflow-builder` package. It's available as:

```bash
npx nwb <command>
```

Or add scripts to your `package.json`:

```json
{
  "scripts": {
    "discover-plugins": "nwb discover-plugins",
    "create-plugin": "nwb create-plugin",
    "db:migrate:prod": "nwb migrate-prod"
  }
}
```

## Commands

### `nwb discover-plugins`

Scans the `plugins/` directory and generates all registry files.

```bash
npx nwb discover-plugins
```

**What it does:**

1. Discovers all plugin directories under `plugins/`
2. Imports each plugin to populate the integration registry
3. Generates the following files:
   - `plugins/index.ts` - Imports all plugins and re-exports `LayoutProvider`
   - `lib/types/integration.ts` - Union type of all integration type slugs
   - `lib/step-registry.ts` - Maps action IDs to lazy step import functions
   - `lib/output-display-configs.ts` - Maps action IDs to display configurations
   - `lib/codegen-registry.ts` - Code generation templates
   - `lib/route-registry.ts` - Custom API route definitions from plugins

**When to run:**

- After adding or removing a plugin
- Before `next dev` and `next build` (recommended in your scripts)
- After modifying a plugin's actions, routes, or output configs

**Typical setup:**

```json
{
  "scripts": {
    "dev": "nwb discover-plugins && next dev",
    "build": "nwb discover-plugins && next build"
  }
}
```

### `nwb create-plugin`

Interactive scaffolding tool to create a new plugin from templates.

```bash
npx nwb create-plugin
```

Prompts you for:
- Plugin name / slug
- Display label
- Description
- Initial actions

Creates a complete plugin directory with all required files.

### `nwb migrate-prod`

Run database migrations for production deployments (e.g. on Vercel).

```bash
npx nwb migrate-prod
```

Reads the database URL from `NEXT_WORKFLOW_BUILDER_DATABASE_URL` and applies any pending schema migrations.

## Help

```bash
npx nwb --help
```
