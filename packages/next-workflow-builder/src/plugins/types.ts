// Integration type union - plugins + system integrations
export type IntegrationType =
  | "database"
  | "loop"
  | "switch"
  | string;

// Generic config type - plugins define their own keys via formFields[].configKey
export type IntegrationConfig = Record<string, string | undefined>;

/**
 * Output Display Config (serializable subset for built-in types only)
 */
export type SerializableOutputDisplayConfig = {
  type: "image" | "video" | "url";
  field: string;
};

/** Analysis result type for step file parsing */
export type StepFileAnalysis = {
  hasExportCore: boolean;
  integrationType: string | null;
  coreFunction: {
    name: string;
    params: string;
    returnType: string;
    body: string;
  } | null;
  inputTypes: string[];
  imports: string[];
};
