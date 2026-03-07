# next-workflow-builder

## 0.4.5

### Bug Fixes

- Fix predecessor step output data not being passed to the next step's input. Steps now automatically receive output data from their predecessor nodes merged into their input (config values take precedence). Supports both standardized (`{ success, data: { ... } }`) and custom (`{ success, events: [...] }`) return formats.

## 0.4.4

### Bug Fixes

- Fix template variable resolution for custom plugin outputs that use non-standard return fields (e.g., `{ success: true, events: [...] }`). The auto-unwrap into `.data` now only applies when the requested field doesn't exist at the top level of the step result.

## 0.4.3

### Features

- Display Node ID in node details panel

### Bug Fixes

- Fix Loop step failing when `items` arrives as a JSON string from template processing instead of an array

## 0.4.2

### Features

- Add optional `databaseUrl` config option to `nextWorkflowBuilder()` for overriding the database connection URL instead of relying on `process.env.DATABASE_URL`

## 0.4.0

### Bug Fixes

- Register Loop, Switch, and Merge as system actions in workflow executor, fixing "Unknown action type" errors when executing these built-in plugins

## 0.3.1

### Bug Fixes

- Ensure plugins directory exists during build to prevent missing directory errors

## 0.3.0

### Features

- Add new built-in Loop plugin for iterating over arrays with batch support
- Add new built-in Merge plugin for combining data from multiple inputs
- Add new built-in Switch plugin for rule-based and expression-based routing
- Refactor steps into internal/system plugin architecture

### Bug Fixes

- Fix package metadata

### Documentation

- Add documentation for built-in plugins

## 0.2.0

### Features

- Major package restructure as `next-workflow-builder` (#1)
- Add Better-Auth-UI package replacing custom auth dialog modal
- Add `nwb` CLI with build and dev scripts
- Replace jiti with virtual turbo reference modules for plugin imports
- Pass betterAuth options props in `nextWorkflowBuilder` and Layout props
- Move plugins to consumer app (`examples/demo`) with auto-discovery
- Move layout from package to consumer app for customization
- Add virtual module declarations for plugin and step registries
- Add code generation for plugin step imports

### Bug Fixes

- Fix plugin import resolution
- Fix code generation for proper module exports
- Fix import paths and missing exports
- Fix missing metadata and README

## 0.1.0

### Features

- Initial release of `next-workflow-builder` package
- Visual workflow editor built with React Flow
- Node-based workflow execution engine with step handlers
- Plugin system with dynamic auto-generated registries
- Built-in plugins: Database Query, HTTP Request, Condition
- Authentication via Better Auth with anonymous sessions
- Workflow persistence with Drizzle ORM
- Template variable system for passing data between nodes
- Condition expression evaluation with security validation
- Workflow code export dialog
- Error logging for execution steps
