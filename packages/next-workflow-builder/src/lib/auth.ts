import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

import { isAiGatewayManagedKeysEnabled } from "./ai-gateway/config.js";

import { db } from "./db/index.js";
import {
  accounts,
  sessions,
  users,
  verifications,
  workflowExecutionLogs,
  workflowExecutions,
  workflowExecutionsRelations,
  workflows,
} from "./db/schema.js";

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

export const auth = betterAuth({
  baseURL: getBaseURL(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    vercel: {
      clientId: process.env.VERCEL_CLIENT_ID as string,
      clientSecret: process.env.VERCEL_CLIENT_SECRET as string,
      scope:
        isAiGatewayManagedKeysEnabled() ?
          ["openid", "email", "profile", "read-write:team"]
          : ["openid", "email", "profile"],
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const session = await getSessionFromCtx(ctx);
      if (!session) return;

      if (session.user.email !== "david38sanchez@gmail.com") {
        throw new APIError("UNAUTHORIZED", {
          code: "UNAUTHORIZED",
          message: "You are not allowed to access this resource",
        });
      }
    }),
  },
});
