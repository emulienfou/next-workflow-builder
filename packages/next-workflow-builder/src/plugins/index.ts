export type {
  ActionConfigField,
  ActionConfigFieldBase,
  ActionConfigFieldGroup,
  ActionWithFullId,
  IntegrationPlugin,
  PluginAction,
} from "./registry.js";

export type { IntegrationType } from "../lib/types/integration.js";

// Export the registry utilities
export {
  computeActionId,
  findActionById,
  flattenConfigFields,
  generateAIActionPrompts,
  getActionsByCategory,
  getAllActions,
  getAllDependencies,
  getAllEnvVars,
  getAllIntegrations,
  getCredentialMapping,
  getDependenciesForActions,
  getIntegration,
  getIntegrationLabels,
  getIntegrationTypes,
  getPluginEnvVars,
  getSortedIntegrationTypes,
  integrationRequiresCredentials,
  isFieldGroup,
  parseActionId,
  registerIntegration,
} from "./registry.js";

export { LEGACY_ACTION_MAPPINGS } from "./legacy-mappings.js";
