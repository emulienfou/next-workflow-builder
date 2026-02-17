// Export the lib utilities
export { getErrorMessage, getErrorMessageAsync } from "../lib/utils";
export type { IntegrationType } from "../lib/types/integration";
export { fetchCredentials } from "../lib/credential-fetcher";
export { type StepInput, withStepLogging } from "../lib/steps/step-handler";

// Export the registry utilities
export type { IntegrationPlugin } from "./registry";
export { registerIntegration, registerCodegenTemplates, getCodegenTemplate, registerOutputDisplayConfigs, getOutputDisplayConfig } from "./registry";
export type { SerializableOutputDisplayConfig } from "./registry";

// Export the steps utilities
export type { StepImporter } from "../lib/steps/index";

// Export managed connection types, atoms, and registration for plugins that provide managed key flows
export {
  registerManagedConnectionProvider,
  managedConnectionProviderAtom,
  managedConnectionStatusAtom,
  managedConnectionTeamsAtom,
  managedConnectionTeamsLoadingAtom,
  managedConnectionTeamsFetchedAtom,
} from "../lib/managed-connection";
export type {
  ManagedConnectionProvider,
  ManagedConnectionApi,
  ManagedConnectionStatus,
  ManagedConnectionTeam,
  ManagedConsentResponse,
  ConsentOverlayProps,
} from "../lib/managed-connection";
