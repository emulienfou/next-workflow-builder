# next-workflow-builder

## 0.6.1

### Improvements

- Reduce published package size from 1.12 MB to ~664 KB by enabling JS minification and removing unused `style-prefixed.css`
- Include `README.md` and `CHANGELOG.md` in published package
- Add `keywords` to `package.json` for npm discoverability

## 0.6.0

### Features

- Add opt-in MCP (Model Context Protocol) server for AI agent integration
- Expose 10 MCP tools: list/get/create/update/delete/duplicate workflows, execute workflows, get execution status, list available actions, list integrations
- OAuth 2.1 authentication via better-auth's built-in `mcp` plugin with dynamic client registration (RFC 7591)
- Streamable HTTP transport at `/api/workflow-builder/mcp`
- New `mcp` config option in `nextWorkflowBuilder()` to enable the server
- New `anonymousAuth` config option to disable anonymous authentication (defaults to `true`)
- Auto-configure `beforeFiles` rewrites for `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` when MCP is enabled — zero consumer setup for OAuth discovery
- Export `oAuthDiscoveryHandler` and `oAuthResourceHandler` from `next-workflow-builder/api` for custom `.well-known` route setups

### Bug Fixes

- Fix MCP OAuth discovery for Claude Desktop and other MCP clients — use better-auth's `oAuthDiscoveryMetadata` and `oAuthProtectedResourceMetadata` helpers with `beforeFiles` rewrites so root-level `.well-known` endpoints work with catch-all page routes
- Fix MCP OAuth login page default from `/sign-in` to `/auth/sign-in` where the `AuthView` component renders
- Fix MCP server requiring OAuth when anonymous auth is enabled — session-authenticated requests bypass OAuth, while unauthenticated requests receive the proper 401 for OAuth discovery
- Fix hydration mismatch in `UserMenu` when session resolves before React hydration completes
- Fix anonymous sign-in returning 404 when social providers are configured — anonymous plugin is now enabled by default regardless of configured providers

## 0.5.0

### Features

- Replace free-text JavaScript condition expressions with structured n8n-style condition builder
- Add data type selection (String, Number, Boolean, Date & Time) with type-specific operators
- Add 27 operators across 4 data types: string (14), number (6), boolean (4), datetime (3)
- Template variable support on both left and right value fields
- Unary operators (exists, is empty, is true, etc.) automatically hide the right value field
- Type-aware comparisons preserve raw values instead of stringifying everything

### Breaking Changes

- Condition nodes now use `leftValue`, `dataType`, `operator`, `rightValue` config fields instead of a single `condition` expression field
- Removed `condition-validator.ts` — structured conditions don't execute arbitrary code

## 0.4.7

### Bug Fixes

- Inline `authOptions` and `databaseUrl` as build-time environment variables via Next.js `env` config. This eliminates the need for an `instrumentation.ts` file to re-set `__NWB_AUTH_OPTIONS` on Vercel serverless cold starts. Works for all auth providers (Vercel, Google, GitHub, etc.).

## 0.4.6

### Features

- Add `integrationRequiresCredentials` helper to check if an integration type requires credentials (has `formFields`). Plugins with no form fields don't need a connection.

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
