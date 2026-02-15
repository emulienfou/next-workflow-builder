import type { IntegrationPlugin } from "../plugins/registry.js";
import { registerIntegration } from "../plugins/registry.js";
import type { StepImporter } from "./steps/index.js";

export interface PluginRegistry {
  stepImporters: Record<string, StepImporter>;
  actionLabels: Record<string, string>;
  plugins: IntegrationPlugin[];
}

let _registry: PluginRegistry = {
  stepImporters: {},
  actionLabels: {},
  plugins: [],
};

/**
 * Store the plugin registry (called from workflowBuilder config).
 * Also registers each IntegrationPlugin in the integration registry.
 */
export function setPluginRegistry(registry: PluginRegistry) {
  _registry = registry;

  for (const plugin of registry.plugins) {
    registerIntegration(plugin);
  }
}

/**
 * Get the current plugin registry.
 */
export function getPluginRegistry(): PluginRegistry {
  return _registry;
}
