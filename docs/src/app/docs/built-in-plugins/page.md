# Built-in Plugins

Built-in plugins are system actions that ship with next-workflow-builder out of the box. They require no installation or configuration and are available in every workflow.

Unlike [marketplace plugins](/docs/plugins) which add third-party integrations, built-in plugins provide core workflow logic and data operations.

## Available Plugins

| Plugin | Description | Category |
| --- | --- | --- |
| [HTTP Request](/docs/built-in-plugins/http-request) | Make HTTP requests to any API endpoint | Network |
| [Condition](/docs/built-in-plugins/condition) | Branch workflow execution based on a condition | Flow Control |
| [Loop](/docs/built-in-plugins/loop) | Iterate over a list of items in batches | Flow Control |
| [Merge](/docs/built-in-plugins/merge) | Combine data from two inputs | Data Transformation |
| [Switch](/docs/built-in-plugins/switch) | Route workflow based on rules or values | Flow Control |
| [Database Query](/docs/built-in-plugins/database-query) | Execute SQL queries against PostgreSQL | Data |

## How Built-in Plugins Differ from Marketplace Plugins

Built-in plugins are part of the `System` category in the action picker. They differ from marketplace plugins in a few ways:

- **No credentials required** (except Database Query, which uses your app's `DATABASE_URL`)
- **No installation** — always available
- **Hardcoded UI fields** — each has a custom React component for configuration rather than using the declarative `configFields` system
- **Inline code generation** — each plugin defines a `codeGenerator` template used when exporting workflows as TypeScript

## Using Built-in Plugins

When creating a workflow, select **System** from the Service dropdown, then pick the action you need:

1. Open a workflow in the editor
2. Add a new action node
3. Select **System** as the service category
4. Choose the built-in plugin from the action dropdown
5. Configure the plugin fields

All built-in plugins support **template references** — you can reference outputs from previous nodes using the `{{NodeName.field}}` syntax or by pressing `@` in template input fields.
