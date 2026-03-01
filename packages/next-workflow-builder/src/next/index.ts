import type { NextConfig } from "next";
import { join } from "node:path";
import { discoverPlugins } from "../plugins/discover";
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

    return {
      ...nextConfig,
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
