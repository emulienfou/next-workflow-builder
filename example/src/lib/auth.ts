import { db, schema } from "@/lib/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

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
});
