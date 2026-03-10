import type { NextConfig } from "next";
import { join } from "node:path";
import { z } from "zod";
import { discoverPlugins } from "../plugins/discover";
import { NextWorkflowBuilderConfigSchema } from "./schema";
import type { NextWorkflowBuilderConfig, WithNextWorkflowBuilder } from "./types";

/**
 * Virtual module name used to resolve the consumer's plugins/index.ts.
 * Resolved at build time via webpack alias and turbopack resolveAlias.
 */
const VIRTUAL_PLUGINS_MODULE = "virtual:workflow-builder-plugins";
const VIRTUAL_STEP_REGISTRY_MODULE = "virtual:workflow-builder-step-registry";

/**
 * Next.js plugin for Workflow Builder.
 *
 * @example
 * ```js
 * // next.config.ts
 * import nextWorkflowBuilder from 'next-workflow-builder'
 *
 * // Set up NextWorkflowBuilder with its configuration
 * const withNextWorkflowBuilder = nextWorkflowBuilder({
 *   // ... Add NextWorkflowBuilder-specific options here
 * })
 *
 * // Export the final Next.js config with NextWorkflowBuilder included
 * export default withNextWorkflowBuilder({
 *   // ... Add regular Next.js options here
 * })
 * ```
 */
const nextWorkflowBuilder = (
  config: NextWorkflowBuilderConfig = {},
): WithNextWorkflowBuilder => {
  const { error, data: loaderOptions } = NextWorkflowBuilderConfigSchema.safeParse(config);
  if (error) {
    console.error("Error validating NextWorkflowBuilderConfig");
    throw z.prettifyError(error);
  }

  // Inject authOptions as env var so server auth code can read it at build time.
  // Next.js inlines process.env values set during config evaluation into server bundles.
  if (loaderOptions.authOptions) {
    process.env.NWB_AUTH_OPTIONS = JSON.stringify(loaderOptions.authOptions);
  }

  if (loaderOptions.databaseUrl) {
    process.env.NWB_DATABASE_URL = loaderOptions.databaseUrl;
  }

  if (loaderOptions.anonymousAuth === false) {
    process.env.NWB_ANONYMOUS_AUTH = "false";
  }

  if (loaderOptions.mcp?.enabled) {
    process.env.NWB_MCP_ENABLED = "true";
    process.env.NWB_MCP_LOGIN_PAGE = loaderOptions.mcp.loginPage || "/auth/sign-in";
  }

  // Discover plugins
  discoverPlugins();

  return function withNextWorkflowBuilder(
    nextConfig: NextConfig = {},
  ): NextConfig {
    // Turbopack needs a relative path (from project root), webpack needs absolute
    const consumerPluginsRelative = "./plugins/index.ts";
    const consumerPluginsAbsolute = join(process.cwd(), "plugins", "index.ts");
    const consumerStepRegistryRelative = "./lib/step-registry.ts";
    const consumerStepRegistryAbsolute = join(process.cwd(), "lib", "step-registry.ts");

    // Inline NWB config as build-time env vars via Next.js `env` config.
    // This uses DefinePlugin (webpack) / equivalent (turbopack) to bake values
    // into the server bundle, so they persist on Vercel serverless cold starts
    // without requiring an instrumentation.ts file.
    const inlinedEnv: Record<string, string> = {};
    if (loaderOptions.authOptions) {
      inlinedEnv.NWB_AUTH_OPTIONS = JSON.stringify(loaderOptions.authOptions);
    }
    if (loaderOptions.databaseUrl) {
      inlinedEnv.NWB_DATABASE_URL = loaderOptions.databaseUrl;
    }
    if (loaderOptions.anonymousAuth === false) {
      inlinedEnv.NWB_ANONYMOUS_AUTH = "false";
    }
    if (loaderOptions.mcp?.enabled) {
      inlinedEnv.NWB_MCP_ENABLED = "true";
      inlinedEnv.NWB_MCP_LOGIN_PAGE = loaderOptions.mcp.loginPage || "/auth/sign-in";
    }

    return {
      ...nextConfig,
      ...(Object.keys(inlinedEnv).length > 0 ? {
        env: {
          ...nextConfig.env,
          ...inlinedEnv,
        },
      } : {}),
      // Turbopack alias (used by `next dev` in Next.js 15+)
      turbopack: {
        ...nextConfig.turbopack,
        resolveAlias: {
          ...nextConfig.turbopack?.resolveAlias,
          [VIRTUAL_PLUGINS_MODULE]: consumerPluginsRelative,
          [VIRTUAL_STEP_REGISTRY_MODULE]: consumerStepRegistryRelative,
        },
      },
      // Webpack alias (used by `next build`)
      webpack: (webpackConfig, options) => {
        webpackConfig.resolve = webpackConfig.resolve || {};
        webpackConfig.resolve.alias = webpackConfig.resolve.alias || {};
        (webpackConfig.resolve.alias as Record<string, string>)[VIRTUAL_PLUGINS_MODULE] = consumerPluginsAbsolute;
        (webpackConfig.resolve.alias as Record<string, string>)[VIRTUAL_STEP_REGISTRY_MODULE] = consumerStepRegistryAbsolute;

        if (typeof nextConfig.webpack === "function") {
          return nextConfig.webpack(webpackConfig, options);
        }
        return webpackConfig;
      },
    };
  };
};

export default nextWorkflowBuilder;

export type {
  NextWorkflowBuilderConfig,
  WithNextWorkflowBuilder,
} from "./types";
