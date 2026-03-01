import { getCredentialMapping } from "../../../../../plugins";
import { getIntegration } from "../../plugins";
import type { IntegrationConfig, IntegrationType } from "../../plugins/types";
import { getIntegrationById } from "../db/integrations";
import type { WorkflowCredentials } from "../types";

// System integrations that don't have plugins need hardcoded mapping
const SYSTEM_CREDENTIAL_MAPPERS: Record<
  string,
  (config: IntegrationConfig) => WorkflowCredentials
> = {
  database: (config) => {
    const creds: WorkflowCredentials = {};
    if (config.url) {
      creds.DATABASE_URL = config.url;
    }
    return creds;
  },
};

/**
 * Map integration config to WorkflowCredentials format
 * Uses plugin registry for plugin integrations, hardcoded mappers for system integrations
 */
function mapIntegrationConfig(
  integrationType: IntegrationType,
  config: IntegrationConfig,
): WorkflowCredentials {
  // Check for system integrations first
  const systemMapper = SYSTEM_CREDENTIAL_MAPPERS[integrationType];
  if (systemMapper) {
    return systemMapper(config);
  }

  // Look up plugin from registry and auto-generate credential mapping
  const plugin = getIntegration(integrationType);
  if (plugin) {
    return getCredentialMapping(plugin, config);
  }

  // Fallback for unknown integrations
  return {};
}

/**
 * Fetch credentials for an integration by ID
 *
 * @param integrationId - The ID of the integration to fetch credentials for
 * @returns WorkflowCredentials object with the integration's credentials
 */
export async function fetchCredentials(
  integrationId: string,
): Promise<WorkflowCredentials> {
  console.log("[Credential Fetcher] Fetching integration:", integrationId);

  const integration = await getIntegrationById(integrationId);

  if (!integration) {
    console.log("[Credential Fetcher] Integration not found");
    return {};
  }

  console.log("[Credential Fetcher] Found integration:", integration.type);

  const credentials = mapIntegrationConfig(
    integration.type,
    integration.config,
  );

  console.log(
    "[Credential Fetcher] Returning credentials for type:",
    integration.type,
  );

  return credentials;
}
