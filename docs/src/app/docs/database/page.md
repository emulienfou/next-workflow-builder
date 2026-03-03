# Database

next-workflow-builder uses PostgreSQL with Drizzle ORM for data storage.

## Connection

Set the `NEXT_WORKFLOW_BUILDER_DATABASE_URL` environment variable:

```env
NEXT_WORKFLOW_BUILDER_DATABASE_URL=postgres://user:password@localhost:5432/workflow
```

The package connects automatically using this URL. No manual database setup code is required.

## Schema

The database schema is available via `schema` from the main package export:

```ts
import { schema } from "next-workflow-builder";
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

Additional tables for Better Auth (`accounts`, `verifications`) and workflow execution tracking
(`workflowExecutions`) are also included.

## Migrations

### Development

Schema changes are applied automatically via Drizzle when the development server starts.

### Production

Run migrations with the CLI:

```bash
npx nwb migrate-prod
```

This reads `NEXT_WORKFLOW_BUILDER_DATABASE_URL` and applies pending migrations.

## Using Drizzle query helpers

The package re-exports Drizzle ORM query helpers for convenience:

```ts
import { schema, eq, and, desc } from "next-workflow-builder";

// Example: query workflows
const userWorkflows = await db
  .select()
  .from(schema.workflows)
  .where(eq(schema.workflows.userId, userId))
  .orderBy(desc(schema.workflows.updatedAt));
```

## Credential encryption

Integration credentials stored in the `integrations` table are encrypted at rest:

```ts
import { encrypt, decrypt } from "next-workflow-builder";

const encrypted = encrypt(JSON.stringify(credentials));
const decrypted = JSON.parse(decrypt(encrypted));
```
