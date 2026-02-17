# Authentication

next-workflow-builder uses [Better Auth](https://www.better-auth.com/) for authentication, with built-in support for
anonymous users, email/password, and social providers.

## Default configuration

Out of the box, the package configures Better Auth with:

- **Anonymous authentication** - Users can start building workflows without signing up
- **Email and password** - Enabled by default with no email verification required
- **Anonymous account migration** - When an anonymous user signs up, their workflows, integrations, and executions are
  automatically migrated to the new account

## Customizing auth

Override auth options in `createWorkflowApiHandler`:

```ts
import { createWorkflowApiHandler } from "next-workflow-builder";

const handler = createWorkflowApiHandler({
  authOptions: {
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
  },
});
```

### Disabling email/password auth

To use only social providers:

```ts
const handler = createWorkflowApiHandler({
  authOptions: {
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      vercel: {
        clientId: process.env.VERCEL_CLIENT_ID || "",
        clientSecret: process.env.VERCEL_CLIENT_SECRET || "",
        scope: ["openid", "email", "profile"],
      },
    },
  },
});
```

## Base URL resolution

Better Auth needs a base URL for callbacks and redirects. The package resolves it in this order:

1. `BETTER_AUTH_URL` environment variable (recommended for production)
2. `NEXT_PUBLIC_APP_URL` environment variable
3. `VERCEL_URL` environment variable (auto-set by Vercel, adds `https://` prefix)
4. `http://localhost:3000` (fallback for local development)

## Anonymous user migration

When an anonymous user links to a real account (e.g. signs up with email or a social provider), the following data is
automatically migrated:

- **Workflows** - All workflows created by the anonymous user
- **Workflow executions** - Execution history and logs
- **Integrations** - Saved integration credentials

This ensures a seamless experience where users can start building immediately and sign up later without losing their
work.

## Auth API routes

All auth routes are handled by Better Auth via the catch-all route:

```
/api/auth/[...all]
```

This includes sign in, sign up, sign out, session management, and OAuth callbacks.

## Environment variables

| Variable | Description |
| --- | --- |
| `BETTER_AUTH_URL` | Base URL for auth callbacks (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `VERCEL_CLIENT_ID` | Vercel OAuth client ID |
| `VERCEL_CLIENT_SECRET` | Vercel OAuth client secret |
