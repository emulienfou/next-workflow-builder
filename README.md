# next-workflow-builder

A Next.js plugin for visual workflow building with drag-and-drop, code
generation, and AI-powered automation.

## Documentation

https://next-workflow-builder.vercel.app

## Development

### Installation

The next-workflow-builder repository uses
[PNPM Workspaces](https://pnpm.io/workspaces) and
[Turborepo](https://github.com/vercel/turborepo).

1. Run `corepack enable` to enable Corepack.

   > If the command above fails, run `npm install -g corepack@latest` to install
   > the latest version of
   > [Corepack](https://github.com/nodejs/corepack?tab=readme-ov-file#manual-installs).

2. Run `pnpm install` to install the project's dependencies.

### Build `next-workflow-builder`

```bash
pnpm --filter next-workflow-builder build
```

Watch mode: `pnpm --filter next-workflow-builder dev`

### Build the docs

```bash
pnpm --filter docs build
```

### Development

You can debug packages together with a consumer app locally. For instance, to
start the example app locally, run

```bash
pnpm --filter example dev
```

Any change to `example/` will be re-rendered instantly.

If you update the core package, a rebuild is required. Or you can use watch mode
in a separate terminal.

## License

Apache-2.0
