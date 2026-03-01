import type {
  ActionConfigField,
  ActionConfigFieldBase,
  ActionConfigFieldGroup,
  ActionWithFullId,
  IntegrationPlugin,
} from "../server/types";
import type { IntegrationType, SerializableOutputDisplayConfig } from "./types";

/**
 * Integration Registry
 * Auto-populated by plugin files
 */
const integrationRegistry = new Map<IntegrationType, IntegrationPlugin>();

/**
 * Codegen Template Registry
 * Auto-populated by consumer's generated lib/codegen-registry.ts
 */
const codegenTemplateRegistry = new Map<string, string>();

/**
 * Output Display Config Registry
 * Auto-populated by consumer's generated lib/output-display-configs.ts
 */
const outputDisplayConfigRegistry = new Map<string, SerializableOutputDisplayConfig>();

/**
 * Register codegen templates (called from consumer's auto-generated codegen-registry.ts)
 */
export function registerCodegenTemplates(templates: Record<string, string>) {
  for (const [actionId, template] of Object.entries(templates)) {
    codegenTemplateRegistry.set(actionId, template);
  }
}

/**
 * Get a codegen template for an action
 */
export function getCodegenTemplate(actionId: string): string | undefined {
  return codegenTemplateRegistry.get(actionId);
}

/**
 * Register output display configs (called from consumer's auto-generated output-display-configs.ts)
 */
export function registerOutputDisplayConfigs(configs: Record<string, SerializableOutputDisplayConfig>) {
  for (const [actionId, config] of Object.entries(configs)) {
    outputDisplayConfigRegistry.set(actionId, config);
  }
}

/**
 * Get the output display config for an action
 */
export function getOutputDisplayConfig(actionId: string): SerializableOutputDisplayConfig | undefined {
  return outputDisplayConfigRegistry.get(actionId);
}

/**
 * Compute full action ID from integration type and action slug
 */
export function computeActionId(
  integrationType: IntegrationType,
  actionSlug: string,
): string {
  return `${ integrationType }/${ actionSlug }`;
}

/**
 * Parse a full action ID into integration type and action slug
 */
export function parseActionId(actionId: string | undefined | null): {
  integration: string;
  slug: string;
} | null {
  if (!actionId || typeof actionId !== "string") {
    return null;
  }
  const parts = actionId.split("/");
  if (parts.length !== 2) {
    return null;
  }
  return { integration: parts[0], slug: parts[1] };
}

/**
 * Register an integration plugin
 */
export function registerIntegration(plugin: IntegrationPlugin) {
  integrationRegistry.set(plugin.type, plugin);
}

/**
 * Get an integration plugin
 */
export function getIntegration(
  type: IntegrationType,
): IntegrationPlugin | undefined {
  return integrationRegistry.get(type);
}

/**
 * Get all registered integrations
 */
export function getAllIntegrations(): IntegrationPlugin[] {
  return Array.from(integrationRegistry.values());
}

/**
 * Get all integration types
 */
export function getIntegrationTypes(): IntegrationType[] {
  return Array.from(integrationRegistry.keys());
}

/**
 * Get all actions across all integrations with full IDs
 */
export function getAllActions(): ActionWithFullId[] {
  const actions: ActionWithFullId[] = [];

  for (const plugin of integrationRegistry.values()) {
    for (const action of plugin.actions) {
      actions.push({
        ...action,
        id: computeActionId(plugin.type, action.slug),
        integration: plugin.type,
      });
    }
  }

  return actions;
}

/**
 * Get actions by category
 */
export function getActionsByCategory(): Record<string, ActionWithFullId[]> {
  const categories: Record<string, ActionWithFullId[]> = {};

  for (const plugin of integrationRegistry.values()) {
    for (const action of plugin.actions) {
      if (!categories[action.category]) {
        categories[action.category] = [];
      }
      categories[action.category].push({
        ...action,
        id: computeActionId(plugin.type, action.slug),
        integration: plugin.type,
      });
    }
  }

  return categories;
}

/**
 * Find an action by full ID (e.g., "resend/send-email")
 * Also supports legacy IDs (e.g., "Send Email") for backward compatibility
 */
export function findActionById(
  actionId: string | undefined | null,
): ActionWithFullId | undefined {
  if (!actionId) {
    return undefined;
  }

  // First try parsing as a namespaced ID
  const parsed = parseActionId(actionId);
  if (parsed) {
    const plugin = integrationRegistry.get(parsed.integration as IntegrationType);
    if (plugin) {
      const action = plugin.actions.find((a) => a.slug === parsed.slug);
      if (action) {
        return {
          ...action,
          id: actionId,
          integration: plugin.type,
        };
      }
    }
  }

  // Fall back to legacy label-based lookup (exact label match)
  for (const plugin of integrationRegistry.values()) {
    const action = plugin.actions.find((a) => a.label === actionId);
    if (action) {
      return {
        ...action,
        id: computeActionId(plugin.type, action.slug),
        integration: plugin.type,
      };
    }
  }

  return undefined;
}

/**
 * Get integration labels map
 */
export function getIntegrationLabels(): Record<IntegrationType, string> {
  const labels: Record<string, string> = {};
  for (const plugin of integrationRegistry.values()) {
    labels[plugin.type] = plugin.label;
  }
  return labels as Record<IntegrationType, string>;
}

/**
 * Get integration descriptions map
 */
export function getIntegrationDescriptions(): Record<IntegrationType, string> {
  const descriptions: Record<string, string> = {};
  for (const plugin of integrationRegistry.values()) {
    descriptions[plugin.type] = plugin.description;
  }
  return descriptions as Record<IntegrationType, string>;
}

/**
 * Get sorted integration types for dropdowns
 */
export function getSortedIntegrationTypes(): IntegrationType[] {
  return Array.from(integrationRegistry.keys()).sort();
}

/**
 * Get all NPM dependencies across all integrations
 */
export function getAllDependencies(): Record<string, string> {
  const deps: Record<string, string> = {};

  for (const plugin of integrationRegistry.values()) {
    if (plugin.dependencies) {
      Object.assign(deps, plugin.dependencies);
    }
  }

  return deps;
}

/**
 * Get NPM dependencies for specific action IDs
 */
export function getDependenciesForActions(
  actionIds: string[],
): Record<string, string> {
  const deps: Record<string, string> = {};
  const integrations = new Set<IntegrationType>();

  // Find which integrations are used
  for (const actionId of actionIds) {
    const action = findActionById(actionId);
    if (action) {
      integrations.add(action.integration);
    }
  }

  // Get dependencies for those integrations
  for (const integrationType of integrations) {
    const plugin = integrationRegistry.get(integrationType);
    if (plugin?.dependencies) {
      Object.assign(deps, plugin.dependencies);
    }
  }

  return deps;
}

/**
 * Get environment variables for a single plugin (from formFields)
 */
export function getPluginEnvVars(
  plugin: IntegrationPlugin,
): Array<{ name: string; description: string }> {
  const envVars: Array<{ name: string; description: string }> = [];

  // Get env vars from form fields
  for (const field of plugin.formFields) {
    if (field.envVar) {
      envVars.push({
        name: field.envVar,
        description: field.helpText || field.label,
      });
    }
  }

  return envVars;
}

/**
 * Get all environment variables across all integrations
 */
export function getAllEnvVars(): Array<{ name: string; description: string }> {
  const envVars: Array<{ name: string; description: string }> = [];

  for (const plugin of integrationRegistry.values()) {
    envVars.push(...getPluginEnvVars(plugin));
  }

  return envVars;
}

/**
 * Get credential mapping for a plugin (auto-generated from formFields)
 */
export function getCredentialMapping(
  plugin: IntegrationPlugin,
  config: Record<string, unknown>,
): Record<string, string> {
  const creds: Record<string, string> = {};

  for (const field of plugin.formFields) {
    if (field.envVar && config[field.configKey]) {
      creds[field.envVar] = String(config[field.configKey]);
    }
  }

  return creds;
}

/**
 * Type guard to check if a field is a group
 */
export function isFieldGroup(
  field: ActionConfigField,
): field is ActionConfigFieldGroup {
  return field.type === "group";
}

/**
 * Flatten config fields, extracting fields from groups
 * Useful for validation and AI prompt generation
 */
export function flattenConfigFields(
  fields: ActionConfigField[],
): ActionConfigFieldBase[] {
  const result: ActionConfigFieldBase[] = [];

  for (const field of fields) {
    if (isFieldGroup(field)) {
      result.push(...field.fields);
    } else {
      result.push(field);
    }
  }

  return result;
}

/**
 * Generate AI prompt section for all available actions
 * This dynamically builds the action types documentation for the AI
 */
export function generateAIActionPrompts(): string {
  const lines: string[] = [];

  for (const plugin of integrationRegistry.values()) {
    for (const action of plugin.actions) {
      const fullId = computeActionId(plugin.type, action.slug);

      // Build example config from configFields (flatten groups)
      const exampleConfig: Record<string, string | number> = {
        actionType: fullId,
      };

      const flatFields = flattenConfigFields(action.configFields);

      for (const field of flatFields) {
        // Skip conditional fields in the example
        if (field.showWhen) continue;

        // Use example, defaultValue, or a sensible default based on type
        if (field.example !== undefined) {
          exampleConfig[field.key] = field.example;
        } else if (field.defaultValue !== undefined) {
          exampleConfig[field.key] = field.defaultValue;
        } else if (field.type === "number") {
          exampleConfig[field.key] = 10;
        } else if (field.type === "select" && field.options?.[0]) {
          exampleConfig[field.key] = field.options[0].value;
        } else {
          exampleConfig[field.key] = `Your ${ field.label.toLowerCase() }`;
        }
      }

      lines.push(
        `- ${ action.label } (${ fullId }): ${ JSON.stringify(exampleConfig) }`,
      );
    }
  }

  return lines.join("\n");
}

export type {
  ActionConfigField,
  ActionConfigFieldBase,
  ActionConfigFieldGroup,
  ActionWithFullId,
  IntegrationPlugin,
  PluginAction,
} from "../server/types";
