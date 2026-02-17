/**
 * Plugins Index
 *
 * This file is managed by you. Add or remove plugin imports as needed.
 *
 * To add a local plugin:
 *   import "./my-plugin";
 *
 * To add an npm-installed plugin:
 *   import "@next-workflow-builder/loop";
 *
 * After editing, run: pnpm discover-plugins (or it runs automatically on build)
 */
"use client";

// Local plugins (side-effect imports trigger registration)
import "./ai-gateway";
import "./blob";
import "./clerk";
import "./fal";
import "./firecrawl";
import "./github";
import "./slack";

// npm-installed system plugins
import "@next-workflow-builder/loop";

// Register auto-generated data into the plugin registry
import "../lib/output-display-configs";
import "../lib/codegen-registry";

// Client-only registrations (managed connections, etc.)
import "./ai-gateway/client";

// Re-export LayoutProvider with plugins pre-registered via side-effect imports above
export { LayoutProvider } from "next-workflow-builder/components";
