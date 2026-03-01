import type { NextConfig } from "next";

/**
 * Configuration options for the Next Workflow Builder plugin.
 */
export interface NextWorkflowBuilderConfig {
  /** Enable debug logging. */
  debug?: boolean;
}

/**
 * A function that wraps a Next.js config with Workflow Builder functionality.
 */
export type WithNextWorkflowBuilder = (nextConfig?: NextConfig) => NextConfig
