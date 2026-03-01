import type { NextConfig } from "next";
import { discoverPlugins } from "../plugins/discover";
import type { NextWorkflowBuilderConfig, WithNextWorkflowBuilder } from "./types";

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
    return {
      ...nextConfig,
    };
  };
};

export default nextWorkflowBuilder;

export type {
  NextWorkflowBuilderConfig,
  WithNextWorkflowBuilder,
} from "./types";
