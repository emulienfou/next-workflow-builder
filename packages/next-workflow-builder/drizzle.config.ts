import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config();

export default {
  schema: "node_modules/next-workflow-builder/src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/workflow",
  },
} satisfies Config;
