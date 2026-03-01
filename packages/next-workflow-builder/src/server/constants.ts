import { join } from "node:path";

export const CWD = process.cwd();

// Plugins directory
export const PLUGINS_DIR = join(CWD, "plugins");
export const LIB_DIR = join(CWD, "lib");
export const OUTPUT_FILE = join(PLUGINS_DIR, "index.ts");
export const TYPES_FILE = join(LIB_DIR, "types", "integration.ts");
export const GITIGNORE_FILE = join(CWD, ".gitignore");
export const STEP_REGISTRY_FILE = join(LIB_DIR, "step-registry.ts");
export const OUTPUT_CONFIGS_FILE = join(LIB_DIR, "output-display-configs.ts");
export const CODEGEN_REGISTRY_FILE = join(LIB_DIR, "codegen-registry.ts");
// System integrations that don't have plugins
export const SYSTEM_INTEGRATION_TYPES = ["database"] as const;
// Regex patterns for codegen template generation
export const LEADING_WHITESPACE_PATTERN = /^\s*/;
// Path to the Next.js boilerplate directory
export const BOILERPLATE_PATH = join(process.cwd(), "lib", "next-boilerplate");
// Path to the codegen templates directory
export const CODEGEN_TEMPLATES_PATH = join(process.cwd(), "lib", "codegen-templates");
// Regex patterns for code generation
export const NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9\s]/g;
export const WHITESPACE_SPLIT_REGEX = /\s+/;
export const TEMPLATE_EXPORT_REGEX = /export default `([\s\S]*)`/;

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

