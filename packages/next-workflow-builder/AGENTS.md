# Agent Instructions

Source project: `packages/workflow-builder-template`

Do NOT update package `workflow-builder-template` only `next-workflow-builder`

## Generated Files in Next.js app:

- example/lib/codegen-registry.ts
- example/lib/output-display-configs.ts
- example/lib/step-registry.ts
- example/lib/types/integration.ts

## Update package `next-workflow-builder` code

Package `next-workflow-builder` should be able to load generated files above to be able to load plugins.

Update/add/generate new code inside `next-workflow-builder` package to load these files.
File `example/lib/types/integration.ts` should be merged with file `packages/next-workflow-builder/src/lib/types/integration.ts`.
Load/import file `example/plugins/index.ts`
