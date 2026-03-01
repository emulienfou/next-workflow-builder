import { join } from "node:path";

export const CWD = process.cwd();

// Pluginss directory
export const PLUGINS_DIR = join(CWD, "plugins");
export const LIB_DIR = join(CWD, "lib");
export const OUTPUT_FILE = join(PLUGINS_DIR, "index.ts");
export const TYPES_FILE = join(LIB_DIR, "types", "integration.ts");
export const STEP_REGISTRY_FILE = join(LIB_DIR, "step-registry.ts");
export const OUTPUT_CONFIGS_FILE = join(LIB_DIR, "output-display-configs.ts");
export const CODEGEN_REGISTRY_FILE = join(LIB_DIR, "codegen-registry.ts");
// System integrations that don't have plugins
export const SYSTEM_INTEGRATION_TYPES = ["database"] as const;
// Regex patterns for codegen template generation
export const LEADING_WHITESPACE_PATTERN = /^\s*/;

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
