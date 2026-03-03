# Deployment

## Vercel

next-workflow-builder is designed to work seamlessly with Vercel deployments.

### 1. Set environment variables

In your Vercel project settings, add:

```env
NEXT_WORKFLOW_BUILDER_DATABASE_URL=postgres://user:password@host:5432/workflow
BETTER_AUTH_URL=https://your-domain.com
```

For preview deployments, `BETTER_AUTH_URL` is not required. The package automatically uses the `VERCEL_URL`
environment variable that Vercel sets automatically.

### 2. Configure build command

Make sure plugin discovery runs before the build:

```json
{
  "scripts": {
    "build": "nwb discover-plugins && next build"
  }
}
```

### 3. Run database migrations

For the initial deployment (or after schema changes), run migrations:

```bash
npx nwb migrate-prod
```

You can add this as a Vercel build step or run it manually after your database is provisioned.

### 4. Social auth providers

If using social authentication, configure the OAuth provider's callback URL to point to your deployed domain:

```
https://your-domain.com/api/auth/callback/{provider}
```

## Self-hosted

### Requirements

- Node.js 18+
- PostgreSQL 14+
- A process manager (PM2, systemd, Docker, etc.)

### Steps

1. Build the application:

```bash
pnpm install
nwb discover-plugins
next build
```

2. Set environment variables:

```env
NEXT_WORKFLOW_BUILDER_DATABASE_URL=postgres://user:password@localhost:5432/workflow
BETTER_AUTH_URL=https://your-domain.com
NODE_ENV=production
```

3. Run migrations:

```bash
npx nwb migrate-prod
```

4. Start the server:

```bash
next start
```

## Docker

Example `Dockerfile`:

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx nwb discover-plugins
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## Database hosting

The package works with any PostgreSQL provider:

- **Vercel Postgres** / **Neon** - Serverless Postgres, works well with Vercel deployments
- **Supabase** - Managed Postgres with additional features
- **Railway** - Simple managed Postgres
- **Self-hosted** - Any PostgreSQL 14+ instance

Set the connection string in `NEXT_WORKFLOW_BUILDER_DATABASE_URL`.
