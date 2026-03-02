import type { BetterAuthOptions } from "better-auth";

export interface WfbAuthConfig {
  hasRealProviders: boolean;
  authOptions?: BetterAuthOptions;
}

/**
 * Get the current auth configuration.
 * Reads provider list from WFB_AUTH_PROVIDERS env var.
 * Reads authOptions from __NWB_AUTH_OPTIONS env var (set by nextWorkflowBuilder()).
 */
export function getAuthConfig(): WfbAuthConfig {
  const authOptions = process.env.__NWB_AUTH_OPTIONS
    ? JSON.parse(process.env.__NWB_AUTH_OPTIONS) as BetterAuthOptions
    : undefined;

  return {
    hasRealProviders: Object.keys(authOptions?.socialProviders ?? {})?.length > 0,
    authOptions,
  };
}
