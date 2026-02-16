// Integration type union - plugins + system integrations
export type IntegrationType = "database" | "ai-gateway" | string;

// Generic config type - plugins define their own keys via formFields[].configKey
export type IntegrationConfig = Record<string, string | undefined>;
