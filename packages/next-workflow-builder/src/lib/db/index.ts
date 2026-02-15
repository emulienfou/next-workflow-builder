import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { schema } from "../../server/db/schema.js";

function getDatabaseUrl(): string {
  const url = process.env.NEXT_WORKFLOW_BUILDER_DATABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_WORKFLOW_BUILDER_DATABASE_URL is not set. Add it to your .env file.",
    );
  }
  return url;
}

let _db: PostgresJsDatabase<typeof schema>;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getDatabaseUrl(), { schema });
  }
  return _db;
}
