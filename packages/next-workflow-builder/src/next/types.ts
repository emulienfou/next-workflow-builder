import type { NextConfig } from "next";
import { z } from "zod";
import { NextWorkflowBuilderConfigSchema } from "./schema";

/**
 * Configuration options for the Next Workflow Builder plugin.
 * Infer the type from the schema
 */
export type NextWorkflowBuilderConfig = z.infer<typeof NextWorkflowBuilderConfigSchema>;

/**
 * A function that wraps a Next.js config with Workflow Builder functionality.
 */
export type WithNextWorkflowBuilder = (nextConfig?: NextConfig) => NextConfig
