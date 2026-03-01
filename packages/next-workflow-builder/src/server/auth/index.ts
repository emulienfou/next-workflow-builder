import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, genericOAuth } from "better-auth/plugins";
import { eq } from "drizzle-orm";
// import { isAiGatewayManagedKeysEnabled } from "../ai-gateway/config";
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
 * Validate auth config at startup — throws actionable errors for missing env vars.
 * Only validates when real OAuth providers are configured.
 */
function validateAuthConfig() {
  const config = getAuthConfig();
  const hasRealProviders = config.providers.length > 0;

  if (hasRealProviders && !process.env.BETTER_AUTH_URL && !process.env.NEXT_PUBLIC_APP_URL && !process.env.VERCEL_URL) {
    throw new Error(
      "[workflow-builder] BETTER_AUTH_URL is required when OAuth providers are configured. " +
      "Set BETTER_AUTH_URL to your app's base URL (e.g., https://yourapp.com).",
    );
  }

  if (config.providers.includes("github") && !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error(
      "[workflow-builder] GITHUB_CLIENT_SECRET is required when GitHub provider is configured. " +
      "Add it to your .env.local file.",
    );
  }

  if (config.providers.includes("google") && !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "[workflow-builder] GOOGLE_CLIENT_SECRET is required when Google provider is configured. " +
      "Add it to your .env.local file.",
    );
  }
}

/**
 * Build the better-auth instance from the current auth config.
 * Called once at module initialization time.
 */
function buildAuth() {
  validateAuthConfig();

  const config = getAuthConfig();
  const hasRealProviders = config.providers.length > 0;

  // Config-driven social providers — only include providers listed in config
  const socialProviders: Record<string, unknown> = {};
  if (config.providers.includes("github")) {
    socialProviders.github = {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    };
  }
  if (config.providers.includes("google")) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    };
  }

  // Build plugins array conditionally
  const plugins = [
    // Anonymous sessions: enabled only when NO real providers configured (zero-config default)
    ...(!hasRealProviders ? [
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
    // Vercel genericOAuth: always available when VERCEL_CLIENT_ID env var exists
    // This is a built-in integration, not a user-configured provider
    ...(process.env.VERCEL_CLIENT_ID
      ? [
        genericOAuth({
          config: [
            {
              providerId: "vercel",
              clientId: process.env.VERCEL_CLIENT_ID,
              clientSecret: process.env.VERCEL_CLIENT_SECRET || "",
              authorizationUrl: "https://vercel.com/oauth/authorize",
              tokenUrl: "https://api.vercel.com/login/oauth/token",
              userInfoUrl: "https://api.vercel.com/login/oauth/userinfo",
              // Include read-write:team scope when AI Gateway User Keys is enabled
              // This grants APIKey and APIKeyAiGateway permissions for creating user keys
              scopes: ["openid", "email", "profile"],
              // scopes: isAiGatewayManagedKeysEnabled()
              //   ? ["openid", "email", "profile", "read-write:team"]
              //   : ["openid", "email", "profile"],
              discoveryUrl: undefined,
              pkce: true,
              getUserInfo: async (tokens) => {
                const response = await fetch(
                  "https://api.vercel.com/login/oauth/userinfo",
                  {
                    headers: {
                      Authorization: `Bearer ${ tokens.accessToken }`,
                    },
                  },
                );
                const profile = await response.json() as {
                  sub: string;
                  email: string;
                  name?: string;
                  preferred_username?: string;
                  email_verified?: boolean;
                  picture?: string;
                };
                console.log("[Vercel OAuth] userinfo response:", profile);
                return {
                  id: profile.sub,
                  email: profile.email,
                  name: profile.name ?? profile.preferred_username,
                  emailVerified: profile.email_verified ?? true,
                  image: profile.picture,
                };
              },
            },
          ],
        }),
      ]
      : []),
  ];

  return betterAuth({
    baseURL: getBaseURL(),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: config.providers.includes("email"),
      requireEmailVerification: false,
    },
    socialProviders,
    plugins,
  });
}

export const auth = buildAuth();
