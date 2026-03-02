import { Auth, betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  accounts,
  integrations,
  sessions,
  users,
  verifications,
  workflowExecutionLogs,
  workflowExecutions,
  workflowExecutionsRelations,
  workflows,
} from "../db/schema";
import { getAuthConfig } from "./config-store";

// Construct schema object for drizzle adapter
const schema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  workflows,
  workflowExecutions,
  workflowExecutionLogs,
  workflowExecutionsRelations,
};

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

/**
 * Build the better-auth instance from the current auth config.
 * Called once at module initialization time.
 */
function buildAuth() {
  const config = getAuthConfig();

  // Build plugins array conditionally
  const plugins = [
    // Anonymous sessions: enabled only when NO real providers configured (zero-config default)
    ...(!config.hasRealProviders ? [
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
    ] : []),
  ];

  return betterAuth({
    baseURL: getBaseURL(), // always use internal baseURL
    database: drizzleAdapter(db, { // always use internal db
      provider: "pg",
      schema,
    }),
    ...config.authOptions, // user overrides (base layer)
    plugins: [
      ...plugins, // built-in plugins
      ...(config.authOptions?.plugins ?? []), // user's additional plugins
    ] as BetterAuthOptions["plugins"],
  }) as Auth<BetterAuthOptions>;
}

export const auth = buildAuth();
