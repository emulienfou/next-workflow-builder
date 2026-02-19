// Integration type union - plugins + system integrations
export type IntegrationType =
  | "ai-gateway"
  | "database"
  | "loop"
  | "switch"
  | string;

// Generic config type - plugins define their own keys via formFields[].configKey
export type IntegrationConfig = Record<string, string | undefined>;
