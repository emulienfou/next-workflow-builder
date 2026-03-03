# Introduction

**next-workflow-builder** is a Next.js plugin for building visual workflow automation platforms. It provides a complete
drag-and-drop workflow editor, code generation, AI-powered workflow creation, real-time execution tracking, and an
extensible plugin system for third-party integrations.

Built with Next.js 16, React 19, Drizzle ORM, Better Auth, React Flow, and the Vercel AI SDK.

## Features

- **Visual workflow editor** - Drag-and-drop canvas with triggers, actions, and conditions
- **Plugin system** - Extensible integration architecture for any third-party service
- **Code generation** - Export workflows as standalone TypeScript code
- **AI generation** - Create workflows from natural language descriptions
- **Workflow execution** - Run workflows with real-time status tracking and logs
- **Authentication** - Built-in auth via Better Auth with anonymous user support
- **Theming** - Dark, light, and system theme support

## How it works

The package embeds a full workflow builder UI into your Next.js app through a few integration points:

1. **Next.js plugin** wraps your config to enable transpilation and environment setup
2. **Catch-all API route** handles all workflow CRUD, execution, auth, and integration endpoints
3. **Layout provider** wraps your app with theme, state management, and auth context
4. **Catch-all page** renders the workflow editor, homepage, and workflow list

Plugins extend the builder with new integrations (e.g. Slack, GitHub, Stripe). Each plugin defines its
connection credentials, available actions, step handlers, and optionally custom API routes and display components.

## Quick links

- [Getting Started](/docs/getting-started) - Install and set up in 5 minutes
- [Configuration](/docs/configuration) - All configuration options
- [Plugins](/docs/plugins) - Understanding the plugin system
- [Creating Plugins](/docs/creating-plugins) - Build your own integration plugin
- [API Reference](/docs/api-reference) - Server and client exports
- [CLI Reference](/docs/cli-reference) - The `nwb` command-line tool

## Requirements

- Next.js 16+
- React 19+
- TypeScript 5+
- PostgreSQL database
- Node.js 18+
