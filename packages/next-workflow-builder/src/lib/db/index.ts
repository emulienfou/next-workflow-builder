import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

function getDatabaseUrl(): string {
  const url = process.env.NEXT_WORKFLOW_BUILDER_DATABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_WORKFLOW_BUILDER_DATABASE_URL is not set. Add it to your .env file.",
    );
  }
  return url;
}

export const db = drizzle(getDatabaseUrl(), { schema });
