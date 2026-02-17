# Contributing

Thank you for your interest in contributing to the Workflow Marketplace! We're excited to have you here and appreciate your help in expanding the plugin ecosystem for everyone.

## How to contribute a plugin

Adding a new integration to the marketplace is straightforward. Here's the process:

### 1. Clone the repository

```bash
git clone https://github.com/emulienfou/useworkflow-marketplace.git
cd useworkflow-marketplace
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create your plugin

Add your plugin inside the correct category folder under [`plugins/`](https://github.com/emulienfou/useworkflow-marketplace/tree/main/plugins). Categories include:

- **ai** — AI and machine learning services (e.g., OpenAI, Anthropic)
- **communication** — Messaging and notification services (e.g., Slack, Discord)
- **productivity** — Project management and collaboration tools
- **data** — Databases, storage, and data processing
- **developer** — Developer tools and utilities
- **other** — Integrations that don't fit the above categories

> If your integration doesn't fit an existing category, feel free to propose a new one in your pull request.

#### Plugin structure

Each plugin lives in its own directory with all components self-contained:

```
plugins/<category>/<my-integration>/
├── credentials.ts        # Credential type definition
├── icon.tsx              # Icon component (SVG)
├── index.ts              # Plugin definition (ties everything together)
├── steps/                # Action implementations
│   └── my-action.ts      # Server-side step function with stepHandler
├── test.ts               # Connection test function
└── README.md             # Plugin documentation (required)
```

You can use the interactive wizard to scaffold your plugin:

```bash
pnpm create-plugin
```

This will prompt you for:
- **Integration name** (e.g., "Stripe")
- **Integration description** (e.g., "Process payments with Stripe")
- **Action name** (e.g., "Create Payment")
- **Action description** (e.g., "Creates a new payment intent")

The script creates the full plugin structure with your names filled in. You'll still need to customize the generated files (API logic, input/output types, icon, etc.).

### 4. Add a README.md

Every plugin **must** include a `README.md` file at its root. This file is displayed on the marketplace and should contain:

- **Plugin name and description** — What the integration does
- **Setup instructions** — How to obtain API keys or configure credentials
- **Available actions** — List of actions with descriptions
- **Example usage** — How to use the plugin in a workflow
- **Links** — Link to the service's documentation or API reference

### 5. Test your plugin

Before submitting, make sure everything works:

```bash
pnpm type-check    # TypeScript validation
pnpm fix           # Auto-fix linting issues
pnpm dev           # Run locally to test
```

### 6. Create a Pull Request

Push your changes to a fork and open a pull request against the `main` branch.

**PR guidelines:**

- Use a clear title with conventional commit format (e.g., `feat: add Stripe integration`)
- Include a description of what your plugin does
- Include screenshots if applicable
- Make sure all checks pass

## Plugin development guide

For a detailed, step-by-step guide on building plugins — including credential types, test functions, step handlers, declarative config fields, and more — refer to the full [CONTRIBUTING.md](https://github.com/emulienfou/useworkflow-marketplace/blob/main/CONTRIBUTING.md) file in the repository.

## Review process

All contributions go through a review process. Our team reviews each submission focusing on:

- **Security** — Protecting user data and system integrity
- **User value** — Ensuring the plugin benefits users
- **Code quality** — Maintaining high standards for maintainability
- **Documentation** — Plugin includes a clear README.md

We do our best to review submissions promptly. We may provide feedback for improvements or, in some cases, decline contributions that don't align with the project's direction. We appreciate every contribution and will always explain our reasoning.

## Need help?

- Check existing integrations in [`plugins/`](https://github.com/emulienfou/useworkflow-marketplace/tree/main/plugins) for reference
- Read the full [CONTRIBUTING.md](https://github.com/emulienfou/useworkflow-marketplace/blob/main/CONTRIBUTING.md) for detailed technical guidance
- Open an [issue](https://github.com/emulienfou/useworkflow-marketplace/issues) on GitHub
