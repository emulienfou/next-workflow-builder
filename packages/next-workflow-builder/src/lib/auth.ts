import { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { schema } from "../server/db/schema.js";
import { integrations, workflowExecutions, workflows } from "./db/schema.js";

// Determine the base URL for authentication
// This supports Vercel Preview deployments with dynamic URLs
function getBaseURL() {
  // Priority 1: Explicit BETTER_AUTH_URL (set manually for production/dev)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  // Priority 2: NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 3: Check if we're on Vercel (for preview deployments)
  if (process.env.VERCEL_URL) {
    // VERCEL_URL doesn't include protocol, so add it
    // Use https for Vercel deployments (both production and preview)
    return `https://${ process.env.VERCEL_URL }`;
  }

  // Fallback: Local development
  return "http://localhost:3000";
}

// Build plugins array conditionally
function buildPlugins(db: PostgresJsDatabase<typeof schema>) {
  return [
    anonymous({
      async onLinkAccount(data) {
        // When an anonymous user links to a real account, migrate their data
        const fromUserId = data.anonymousUser.user.id;
        const toUserId = data.newUser.user.id;

        console.log(
          `[Anonymous Migration] Migrating from user ${ fromUserId } to ${ toUserId }`,
        );

        try {
          // Migrate workflows
          await db
            .update(workflows)
            .set({ userId: toUserId })
            .where(eq(workflows.userId, fromUserId));

          // Migrate workflow executions
          await db
            .update(workflowExecutions)
            .set({ userId: toUserId })
            .where(eq(workflowExecutions.userId, fromUserId));

          // Migrate integrations
          await db
            .update(integrations)
            .set({ userId: toUserId })
            .where(eq(integrations.userId, fromUserId));

          console.log(
            `[Anonymous Migration] Successfully migrated data from ${ fromUserId } to ${ toUserId }`,
          );
        } catch (error) {
          console.error(
            "[Anonymous Migration] Error migrating user data:",
            error,
          );
          throw error;
        }
      },
    }),
  ];
}

export function getDefaultAuthOptions(db: PostgresJsDatabase<typeof schema>): BetterAuthOptions {
  return {
    baseURL: getBaseURL(),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: buildPlugins(db),
  };
}
