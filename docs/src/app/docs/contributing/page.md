# Contributing

## Monorepo setup

The project is a pnpm monorepo managed with Turborepo:

```
next-workflow-builder/
├── packages/
│   ├── next-workflow-builder/    # The published npm package
│   └── workflow-builder-template/ # Full template with 14+ plugins
├── example/                       # Minimal example consumer app
├── docs/                          # Documentation (Nextra)
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting started

```bash
# Clone the repository
git clone <repo-url>
cd next-workflow-builder

# Install dependencies
pnpm install

# Build the package
pnpm build:nwb

# Run the example app
pnpm dev:example
```

## Development workflow

### Building the package

```bash
pnpm build:nwb
```

This runs TypeScript compilation, fixes ESM imports, and copies static assets.

### Running the example app

```bash
pnpm dev:example
```

The example app uses `workspace:*` to link the local package, so changes to the package are reflected after rebuilding.

### Running docs

```bash
pnpm dev:docs
```

### Running tests

```bash
pnpm test
```

## Package development guidelines

- Only modify code in `packages/next-workflow-builder/`
- Do not modify `packages/workflow-builder-template/` directly
- The `example/` app serves as a minimal integration test
- Run `nwb discover-plugins` in the example directory after changing plugin-related code

## Plugin development

When creating community plugins:

- Follow the plugin structure documented in [Creating Plugins](/docs/creating-plugins)
- Prefer `fetch` over SDK dependencies to reduce supply chain attack surface
- Always import `"server-only"` in step files
- Use `withStepLogging` for execution tracking
- Include a connection test function
- Test with the example app before publishing

## Docs development

The docs use [Nextra](https://nextra.site/) (v4) with the docs theme. Pages are markdown files under
`docs/src/app/docs/`.

To add a new page:

1. Create `docs/src/app/docs/{page-name}/page.md`
2. Add an entry in `docs/src/app/_meta.global.tsx` under the `docs.items` object
3. Write your content in markdown

## Submitting changes

1. Create a branch from `main`
2. Make your changes
3. Ensure the package builds: `pnpm build:nwb`
4. Test with the example app
5. Open a pull request against `main`
