# Database

next-workflow-builder uses PostgreSQL with Drizzle ORM for data storage.

## Connection

Set the `DATABASE_URL` environment variable:

```env
DATABASE_URL=postgres://user:password@localhost:5432/workflow
```

The package connects automatically using this URL. No manual database setup code is required.

Alternatively, you can pass the connection URL directly in your `next.config.ts`:

```ts
const withNextWorkflowBuilder = nextWorkflowBuilder({
  databaseUrl: process.env.DATABASE_URL,
});
```

When `databaseUrl` is provided, it takes priority over the `DATABASE_URL` environment variable.

## Drizzle configuration

The package ships a ready-to-use `drizzle.config.ts` — no need to create your own. All Drizzle Kit commands can reference it directly:

```bash
pnpm drizzle-kit generate --config=node_modules/next-workflow-builder/drizzle.config.ts
```

If you prefer a local config (e.g. to customize the output directory), create a `drizzle.config.ts` at your project root:

```ts
// drizzle.config.ts
import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config();

export default {
  schema: "next-workflow-builder/server/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/workflow",
  },
} satisfies Config;
```

## Schema

Database tables are exported from `next-workflow-builder/server`:

```ts
import {
  users,
  sessions,
  accounts,
  verifications,
  workflows,
  integrations,
  workflowExecutions,
  workflowExecutionLogs,
  apiKeys,
  db,
} from "next-workflow-builder/server";
```

### Tables

#### `users`

Better Auth user accounts.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Primary key |
| `name` | `text` | Display name |
| `email` | `text` | Unique email address |
| `emailVerified` | `boolean` | Whether email is verified |
| `image` | `text` | Avatar URL |
| `isAnonymous` | `boolean` | Whether this is an anonymous user |
| `createdAt` | `timestamp` | Created timestamp |
| `updatedAt` | `timestamp` | Updated timestamp |

#### `sessions`

Active user sessions.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Primary key |
| `token` | `text` | Unique session token |
| `userId` | `text` | Foreign key to users |
| `expiresAt` | `timestamp` | Session expiry |
| `ipAddress` | `text` | Client IP |
| `userAgent` | `text` | Client user agent |

#### `workflows`

User workflows with their canvas state.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Primary key (auto-generated nanoid) |
| `name` | `text` | Workflow name |
| `description` | `text` | Optional description |
| `userId` | `text` | Foreign key to users |
| `nodes` | `jsonb` | Array of React Flow nodes |
| `edges` | `jsonb` | Array of React Flow edges |
| `visibility` | `text` | `"private"` or `"public"` |
| `createdAt` | `timestamp` | Created timestamp |
| `updatedAt` | `timestamp` | Updated timestamp |

#### `integrations`

Stored integration credentials (encrypted).

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Primary key (auto-generated nanoid) |
| `userId` | `text` | Foreign key to users |
| `name` | `text` | Connection display name |
| `type` | `text` | Integration type slug (e.g. `"slack"`, `"github"`) |
| `config` | `jsonb` | Encrypted credential configuration |
| `isManaged` | `boolean` | Whether this is a managed OAuth connection |
| `createdAt` | `timestamp` | Created timestamp |
| `updatedAt` | `timestamp` | Updated timestamp |

#### `workflowExecutions`

Workflow execution history.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Primary key |
| `workflowId` | `text` | Foreign key to workflows |
| `userId` | `text` | Foreign key to users |
| `status` | `text` | Execution status |
| `createdAt` | `timestamp` | Created timestamp |
| `updatedAt` | `timestamp` | Updated timestamp |

#### `workflowExecutionLogs`

Per-node execution logs within a workflow run.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Primary key |
| `executionId` | `text` | Foreign key to workflowExecutions |
| `nodeId` | `text` | Node that was executed |
| `status` | `text` | Node execution status |
| `output` | `jsonb` | Node output data |
| `createdAt` | `timestamp` | Created timestamp |

#### `apiKeys`

Webhook API keys (stored as hashed values).

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Primary key |
| `userId` | `text` | Foreign key to users |
| `name` | `text` | Key display name |
| `hashedKey` | `text` | Hashed API key value |
| `prefix` | `text` | Key prefix for display |
| `createdAt` | `timestamp` | Created timestamp |

Additional tables for Better Auth (`accounts`, `verifications`) are also included.

## Migrations

### Generating migrations

After installing or upgrading `next-workflow-builder`, generate migration files to capture any schema changes:

```bash
pnpm drizzle-kit generate --config=node_modules/next-workflow-builder/drizzle.config.ts
```

If there are no schema changes, drizzle-kit will report "nothing to migrate" and no files are created.

### Applying migrations

```bash
pnpm drizzle-kit migrate --config=node_modules/next-workflow-builder/drizzle.config.ts
```

Or push the schema directly without migration files (useful for rapid prototyping):

```bash
pnpm drizzle-kit push --config=node_modules/next-workflow-builder/drizzle.config.ts
```

### Convenience scripts

Add shorthand scripts to your `package.json` to avoid repeating the config path:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate --config=node_modules/next-workflow-builder/drizzle.config.ts",
    "db:migrate": "drizzle-kit migrate --config=node_modules/next-workflow-builder/drizzle.config.ts",
    "db:push": "drizzle-kit push --config=node_modules/next-workflow-builder/drizzle.config.ts",
    "db:studio": "drizzle-kit studio --config=node_modules/next-workflow-builder/drizzle.config.ts"
  }
}
```

Then run:

```bash
pnpm db:generate   # Generate migration files
pnpm db:migrate    # Apply migrations
pnpm db:push       # Push schema directly (skip migration files)
pnpm db:studio     # Open Drizzle Studio
```

### Production

Run migrations with the CLI:

```bash
npx nwb migrate-prod
```

This reads `DATABASE_URL` and applies pending schema migrations.

## Using the database instance

The `db` export provides a Drizzle ORM query builder with the full schema:

```ts
import { db, workflows } from "next-workflow-builder/server";
import { eq, desc } from "drizzle-orm";

const userWorkflows = await db.query.workflows.findMany({
  where: eq(workflows.userId, userId),
  orderBy: desc(workflows.updatedAt),
});
```

## Credential encryption

Integration credentials stored in the `integrations` table are encrypted at rest using the
`INTEGRATION_ENCRYPTION_KEY` environment variable:

```ts
import { encrypt, decrypt } from "next-workflow-builder/server";

const encrypted = encrypt(JSON.stringify(credentials));
const decrypted = JSON.parse(decrypt(encrypted));
```
