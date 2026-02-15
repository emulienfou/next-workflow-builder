// Export the lib utilities
export { getErrorMessage } from "../lib/utils.js";
export type { IntegrationType } from "../lib/types/integration.js";
export { fetchCredentials } from "../lib/credential-fetcher.js";
export { type StepInput, withStepLogging } from "../lib/steps/step-handler.js";

// Export the registry utilities
export type { IntegrationPlugin } from "./registry.js";
export { registerIntegration } from "./registry.js";
