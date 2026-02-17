#!/usr/bin/env tsx

/**
 * Plugin Discovery & Registry Generation Script
 *
 * Imports plugins from the user-managed plugins/index.ts file, then generates
 * registry files (types, step-registry, display configs, codegen templates,
 * route registry) from the populated registry.
 *
 * plugins/index.ts is scaffolded once if it doesn't exist, then never overwritten.
 * Users manage their own plugin imports (both local and npm-installed).
 *
 * Run this script:
 * - Manually: pnpm discover-plugins
 * - Automatically: Before build (in package.json)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const PLUGINS_DIR = join(process.cwd(), "plugins");
const OUTPUT_FILE = join(PLUGINS_DIR, "index.ts");
const TYPES_FILE = join(process.cwd(), "lib", "types", "integration.ts");
const STEP_REGISTRY_FILE = join(process.cwd(), "lib", "step-registry.ts");
const OUTPUT_CONFIGS_FILE = join(process.cwd(), "lib", "output-display-configs.ts");
const CODEGEN_REGISTRY_FILE = join(process.cwd(), "lib", "codegen-registry.ts");
const ROUTE_REGISTRY_FILE = join(process.cwd(), "lib", "route-registry.ts");
const README_FILE = join(process.cwd(), "README.md");
const PLUGINS_MARKER_REGEX =
  /<!-- PLUGINS:START[^>]*-->[\s\S]*?<!-- PLUGINS:END -->/;

// System integrations that don't have plugins
const SYSTEM_INTEGRATION_TYPES = ["database"] as const;

// Regex patterns for codegen template generation
const LEADING_WHITESPACE_PATTERN = /^\s*/;

/**
 * Import from local source (for development) or the installed package (for published consumers).
 * Local source is tried first because dist/ may not exist during development.
 */
async function importPackageOrLocal(localRelPath: string): Promise<Record<string, unknown>> {
  const localPath = join(import.meta.dirname, "..", "plugins", localRelPath);
  if (existsSync(localPath)) {
    return await import(pathToFileURL(localPath).href);
  }
  return await import("next-workflow-builder/plugins");
}

/**
 * Parse plugins/index.ts to extract plugin import specifiers.
 * Returns both local (e.g. "./slack") and npm (e.g. "@next-workflow-builder/loop") specifiers.
 * Skips non-plugin imports (client.ts, ../lib/*, re-exports, etc.).
 */
function parsePluginImports(): string[] {
  if (!existsSync(OUTPUT_FILE)) return [];

  const content = readFileSync(OUTPUT_FILE, "utf-8");
  const importRegex = /^\s*import\s+["']([^"']+)["']\s*;/gm;
  const specifiers: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    const spec = match[1];
    // Skip non-plugin imports (auto-generated lib files, client registrations, etc.)
    if (
      spec.includes("/client") ||
      spec.startsWith("../lib/") ||
      spec.startsWith("../") ||
      spec === "next-workflow-builder/components" ||
      spec.startsWith("next-workflow-builder/")
    ) {
      continue;
    }
    specifiers.push(spec);
  }

  return specifiers;
}

/**
 * Import plugins listed in plugins/index.ts to populate the registry.
 *
 * We parse the import specifiers from plugins/index.ts, then import each plugin
 * individually. This avoids importing client-only code (React components, etc.)
 * that can't run in the Node.js/tsx context of discover-plugins.
 *
 * Because consumer plugins import `registerIntegration` from "next-workflow-builder/plugins"
 * (the package specifier), they may populate a different module instance than our relative
 * import of "../plugins/registry". Node.js ESM caches modules by resolved URL, so the same
 * file loaded via a package specifier vs a relative path creates two separate module instances
 * with separate registries.
 *
 * To fix this, we explicitly re-register each plugin's default export with our local registry.
 */
async function importPluginsFromIndex(): Promise<void> {
  const localRegistry = await import("../plugins/registry");
  const specifiers = parsePluginImports();

  if (specifiers.length === 0) {
    console.log("No plugin imports found in plugins/index.ts");
    return;
  }

  console.log(`Importing ${ specifiers.length } plugin(s) from plugins/index.ts...`);
  for (const spec of specifiers) {
    let resolvedPath: string;

    if (spec.startsWith(".")) {
      // Local plugin — resolve relative to plugins/ directory
      resolvedPath = pathToFileURL(join(PLUGINS_DIR, spec, "index.ts")).href;
    } else {
      // npm package — resolve from the consumer's directory (process.cwd()),
      // not from discover-plugins.ts, so the consumer's node_modules is used
      try {
        const { createRequire } = await import("node:module");
        const require = createRequire(join(process.cwd(), "package.json"));
        resolvedPath = pathToFileURL(require.resolve(spec)).href;
      } catch {
        resolvedPath = spec; // fallback to bare specifier
      }
    }

    try {
      const mod = await import(resolvedPath);
      // Explicitly register with our local registry to avoid dual module instance issues
      if (mod.default) {
        localRegistry.registerIntegration(mod.default);
        // Track npm-installed plugins for step-registry import path generation
        if (!spec.startsWith(".")) {
          npmPluginSpecifiers.set(mod.default.type, spec);
        }
      }
    } catch (error) {
      console.warn(`   Warning: Failed to import plugin "${ spec }":`, error);
    }
  }

  console.log(`Registered ${ specifiers.length } plugin(s) with local registry`);
}

/**
 * Format TypeScript code using Prettier
 */
async function formatCode(code: string): Promise<string> {
  try {
    const prettier = await import("prettier");
    return await prettier.format(code, { parser: "typescript" });
  } catch (error) {
    console.warn("   Warning: Failed to format generated code:", error);
    return code;
  }
}

// Track generated codegen templates
const generatedCodegenTemplates = new Map<
  string,
  { template: string; integrationType: string }
>();

// Track npm package specifiers for integration types (e.g. "loop" -> "@next-workflow-builder/loop")
// Used by step-registry to generate correct import paths for npm-installed plugins
const npmPluginSpecifiers = new Map<string, string>();


/**
 * Discover local plugin directories (subdirectories under plugins/).
 * Used for scaffolding and for finding client.ts files.
 */
function discoverLocalPluginDirs(): string[] {
  if (!existsSync(PLUGINS_DIR)) return [];

  const entries = readdirSync(PLUGINS_DIR);
  return entries.filter((entry) => {
    if (
      entry.startsWith("_") ||
      entry.startsWith(".") ||
      entry === "index.ts" ||
      entry === "registry.ts" ||
      entry === "system"
    ) {
      return false;
    }
    const fullPath = join(PLUGINS_DIR, entry);
    try {
      return statSync(fullPath).isDirectory();
    } catch {
      return false;
    }
  }).sort();
}

/**
 * Scaffold plugins/index.ts if it doesn't exist yet.
 * This file is user-managed — the script never overwrites it.
 */
function scaffoldIndexFile(): void {
  if (existsSync(OUTPUT_FILE)) {
    console.log("plugins/index.ts already exists, skipping scaffold");
    return;
  }

  // Discover local plugin directories to pre-populate the scaffold
  const localPlugins = discoverLocalPluginDirs();
  const imports = localPlugins.length > 0
    ? localPlugins.map((plugin) => `import "./${ plugin }";`).join("\n")
    : '// import "./my-plugin";';

  // Detect plugins with client.ts for client-only registrations
  const clientImports = localPlugins
    .filter((plugin) => existsSync(join(PLUGINS_DIR, plugin, "client.ts")))
    .map((plugin) => `import "./${ plugin }/client";`)
    .join("\n");

  const content = `/**
 * Plugins Index
 *
 * This file is managed by you. Add or remove plugin imports as needed.
 *
 * To add a local plugin:
 *   import "./my-plugin";
 *
 * To add an npm-installed plugin:
 *   import "@next-workflow-builder/loop";
 *
 * After editing, run: pnpm discover-plugins (or it runs automatically on build)
 */
"use client";

// Local plugins (side-effect imports trigger registration)
${ imports }

// Register auto-generated data into the plugin registry
import "../lib/output-display-configs";
import "../lib/codegen-registry";
${ clientImports ? `\n// Client-only registrations (managed connections, etc.)\n${ clientImports }` : "" }

// Re-export LayoutProvider with plugins pre-registered via side-effect imports above
export { LayoutProvider } from "next-workflow-builder/components";
`;

  writeFileSync(OUTPUT_FILE, content, "utf-8");
  console.log("Scaffolded plugins/index.ts");
}

/**
 * Ensure generated files are listed in the consumer's .gitignore
 * (it's auto-generated and should not be committed).
 */
function ensureGitignore(): void {
  const gitignorePath = join(process.cwd(), ".gitignore");
  const SECTION_HEADER = "# Auto-generated by discover-plugins";

  // Collect all absolute paths we want to ignore
  // Note: OUTPUT_FILE (plugins/index.ts) is excluded — it's user-managed and should be committed
  const filesToIgnore = [
    TYPES_FILE,
    STEP_REGISTRY_FILE,
    OUTPUT_CONFIGS_FILE,
    CODEGEN_REGISTRY_FILE,
    ROUTE_REGISTRY_FILE,
  ];

  // Convert to relative paths
  const relativePaths = filesToIgnore.map((file) => relative(process.cwd(), file));

  let content = "";
  if (existsSync(gitignorePath)) {
    content = readFileSync(gitignorePath, "utf-8");
  }

  const existingLines = new Set(content.split("\n").map((line) => line.trim()));
  const newEntries = relativePaths.filter((entry) => !existingLines.has(entry));

  if (newEntries.length > 0) {
    let textToAppend = "";

    // 1. Ensure we start on a new line if the file doesn't end with one
    if (content.length > 0 && !content.endsWith("\n")) {
      textToAppend += "\n";
    }

    // 2. Add the comment only if it doesn't exist yet
    if (!content.includes(SECTION_HEADER)) {
      textToAppend += `${ SECTION_HEADER }\n`;
    }

    // 3. Add the new files
    textToAppend += newEntries.join("\n") + "\n";

    writeFileSync(gitignorePath, content + textToAppend, "utf-8");
    console.log(`Updated .gitignore with ${ newEntries.length } new file(s).`);
  }
}

/**
 * Update the README.md with the current list of actions
 */
async function updateReadme(): Promise<void> {
  // Import the registry utilities (registry is already populated by importConsumerPlugins in main)
  const { getAllIntegrations } = await importPackageOrLocal("registry.ts") as {
    getAllIntegrations: () => { label: string; actions: { label: string }[] }[]
  };

  const integrations = getAllIntegrations();

  if (integrations.length === 0) {
    console.log("No integrations found, skipping README update");
    return;
  }

  // Generate markdown list grouped by integration
  const actionsList = integrations
    .map((integration) => {
      const actionLabels = integration.actions.map((a) => a.label).join(", ");
      return `- **${ integration.label }**: ${ actionLabels }`;
    })
    .join("\n");

  // Read current README
  const readme = readFileSync(README_FILE, "utf-8");

  // Check if markers exist
  if (!readme.includes("<!-- PLUGINS:START")) {
    console.log("README markers not found, skipping README update");
    return;
  }

  // Replace content between markers
  const updated = readme.replace(
    PLUGINS_MARKER_REGEX,
    `<!-- PLUGINS:START - Do not remove. Auto-generated by discover-plugins -->\n${ actionsList }\n<!-- PLUGINS:END -->`,
  );

  writeFileSync(README_FILE, updated, "utf-8");
  console.log(`Updated README.md with ${ integrations.length } integration(s)`);
}

/**
 * Generate the lib/types/integration.ts file with dynamic types
 */
async function generateTypesFile(): Promise<void> {
  // Ensure the types directory exists
  const typesDir = dirname(TYPES_FILE);
  if (!existsSync(typesDir)) {
    mkdirSync(typesDir, { recursive: true });
  }

  // Get plugin types from registry
  const { getIntegrationTypes } = await import("../plugins/registry");
  const pluginTypes = getIntegrationTypes();

  // Combine plugin types with system types
  const allTypes = [...pluginTypes, ...SYSTEM_INTEGRATION_TYPES].sort();

  // Generate the union type
  const unionType = allTypes.map((t) => `  | "${ t }"`).join("\n");

  const content = `/**
 * Integration Types (Auto-Generated)
 *
 * This file is automatically generated by scripts/discover-plugins.ts
 * DO NOT EDIT MANUALLY - your changes will be overwritten!
 *
 * To add a new integration type:
 * 1. Create a plugin in plugins/ directory, OR
 * 2. Add a system integration to SYSTEM_INTEGRATION_TYPES in discover-plugins.ts
 * 3. Run: pnpm discover-plugins
 *
 * Generated types: ${ allTypes.join(", ") }
 */

// Integration type union - plugins + system integrations
export type IntegrationType =
${ unionType };

// Generic config type - plugins define their own keys via formFields[].configKey
export type IntegrationConfig = Record<string, string | undefined>;
`;

  writeFileSync(TYPES_FILE, content, "utf-8");
  console.log(
    `Generated lib/types/integration.ts with ${ allTypes.length } type(s)`,
  );
}

// ============================================================================
// Codegen Template Generation
// ============================================================================

/** Analysis result type for step file parsing */
type StepFileAnalysis = {
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

/** Create empty analysis result */
function createEmptyAnalysis(): StepFileAnalysis {
  return {
    hasExportCore: false,
    integrationType: null,
    coreFunction: null,
    inputTypes: [],
    imports: [],
  };
}

/** Process exported variable declarations */
function processExportedVariable(
  decl: ts.VariableDeclaration,
  result: StepFileAnalysis,
): void {
  if (!ts.isIdentifier(decl.name)) {
    return;
  }

  const name = decl.name.text;
  const init = decl.initializer;

  if (name === "_integrationType" && init && ts.isStringLiteral(init)) {
    result.integrationType = init.text;
  }
}

/** Check if a type name should be included in exports */
function shouldIncludeType(typeName: string): boolean {
  return (
    typeName.endsWith("Result") ||
    typeName.endsWith("Credentials") ||
    typeName.endsWith("CoreInput")
  );
}

/** Check if an import should be included in exports */
function shouldIncludeImport(moduleSpec: string, importText: string): boolean {
  // Skip internal imports
  if (moduleSpec.startsWith("@/") || moduleSpec.startsWith(".")) {
    return false;
  }
  // Skip server-only import
  if (importText.includes("server-only")) {
    return false;
  }
  return true;
}

/** Extract function info from a function declaration */
function extractFunctionInfo(
  node: ts.FunctionDeclaration,
  sourceCode: string,
): StepFileAnalysis["coreFunction"] {
  if (!(node.name && node.body)) {
    return null;
  }

  const params = node.parameters
    .map((p) => sourceCode.slice(p.pos, p.end).trim())
    .join(", ");

  const returnType = node.type
    ? sourceCode.slice(node.type.pos, node.type.end).trim()
    : "Promise<unknown>";

  const body = sourceCode.slice(node.body.pos, node.body.end).trim();

  return {
    name: node.name.text,
    params,
    returnType,
    body,
  };
}

/** Process variable statement node */
function processVariableStatement(
  node: ts.VariableStatement,
  result: StepFileAnalysis,
): void {
  const isExported = node.modifiers?.some(
    (m) => m.kind === ts.SyntaxKind.ExportKeyword,
  );
  if (!isExported) {
    return;
  }

  for (const decl of node.declarationList.declarations) {
    processExportedVariable(decl, result);
  }
}

/** Process type alias node */
function processTypeAlias(
  node: ts.TypeAliasDeclaration,
  sourceCode: string,
  result: StepFileAnalysis,
): void {
  if (shouldIncludeType(node.name.text)) {
    result.inputTypes.push(sourceCode.slice(node.pos, node.end).trim());
  }
}

/** Process import declaration node */
function processImportDeclaration(
  node: ts.ImportDeclaration,
  sourceCode: string,
  result: StepFileAnalysis,
): void {
  const spec = node.moduleSpecifier;
  if (!ts.isStringLiteral(spec)) {
    return;
  }
  const importText = sourceCode.slice(node.pos, node.end).trim();
  if (shouldIncludeImport(spec.text, importText)) {
    result.imports.push(importText);
  }
}

/** Process a single AST node for exports, types, and imports */
function processNode(
  node: ts.Node,
  sourceCode: string,
  result: StepFileAnalysis,
): void {
  if (ts.isVariableStatement(node)) {
    processVariableStatement(node, result);
    return;
  }

  if (ts.isTypeAliasDeclaration(node)) {
    processTypeAlias(node, sourceCode, result);
    return;
  }

  if (ts.isImportDeclaration(node)) {
    processImportDeclaration(node, sourceCode, result);
    return;
  }

  // Check for stepHandler function (doesn't need to be exported)
  if (ts.isFunctionDeclaration(node) && node.name?.text === "stepHandler") {
    result.hasExportCore = true;
    result.coreFunction = extractFunctionInfo(node, sourceCode);
  }
}

/**
 * Extract information about a step file's exports using TypeScript AST
 */
function analyzeStepFile(filePath: string): StepFileAnalysis {
  const result = createEmptyAnalysis();

  if (!existsSync(filePath)) {
    return result;
  }

  const sourceCode = readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );

  // Single pass: find stepHandler function, types, and imports
  ts.forEachChild(sourceFile, (node) => {
    processNode(node, sourceCode, result);
  });

  return result;
}

/**
 * Generate a codegen template from a step file's core function
 */
async function generateCodegenTemplate(
  stepFilePath: string,
  stepFunctionName: string,
): Promise<string | null> {
  const analysis = analyzeStepFile(stepFilePath);

  if (!(analysis.hasExportCore && analysis.coreFunction)) {
    return null;
  }

  const { coreFunction, integrationType, inputTypes, imports } = analysis;

  // Extract the inner body (remove outer braces)
  let innerBody = coreFunction.body.trim();
  if (innerBody.startsWith("{")) {
    innerBody = innerBody.slice(1);
  }
  if (innerBody.endsWith("}")) {
    innerBody = innerBody.slice(0, -1);
  }
  innerBody = innerBody.trim();

  // Extract input type from first parameter
  const inputType =
    coreFunction.params
      .split(",")[0]
      .replace(LEADING_WHITESPACE_PATTERN, "")
      .split(":")[1]
      ?.trim() || "unknown";

  // Build the raw template (formatter will fix indentation)
  const rawTemplate = `${ imports.join("\n") }
import { fetchCredentials } from './lib/credential-helper';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

${ inputTypes.join("\n\n") }

export async function ${ stepFunctionName }(input: ${ inputType }): ${ coreFunction.returnType } {
  "use step";
  const credentials = await fetchCredentials("${ integrationType || "unknown" }");
${ innerBody }
}`;

  // Format the generated code
  return await formatCode(rawTemplate);
}

/**
 * Process step files and generate codegen templates
 */
async function processStepFilesForCodegen(): Promise<void> {
  const { getAllIntegrations, computeActionId } = await import("../plugins/registry");
  const integrations = getAllIntegrations();

  for (const integration of integrations) {
    for (const action of integration.actions) {
      // Resolve step file path: local plugins use PLUGINS_DIR, npm plugins use their package directory
      let stepFilePath: string;
      const npmSpec = npmPluginSpecifiers.get(integration.type);
      if (npmSpec) {
        try {
          const { createRequire } = await import("node:module");
          const require = createRequire(join(process.cwd(), "package.json"));
          const pkgDir = dirname(require.resolve(`${ npmSpec }/package.json`));
          stepFilePath = join(pkgDir, "steps", `${ action.stepImportPath }.ts`);
        } catch {
          continue; // Skip if we can't resolve the npm package
        }
      } else {
        stepFilePath = join(
          PLUGINS_DIR,
          integration.type,
          "steps",
          `${ action.stepImportPath }.ts`,
        );
      }

      const template = await generateCodegenTemplate(
        stepFilePath,
        action.stepFunction,
      );

      if (template) {
        const actionId = computeActionId(integration.type, action.slug);
        generatedCodegenTemplates.set(actionId, {
          template,
          integrationType: integration.type,
        });
        console.log(`   Generated codegen template for ${ actionId }`);
      }
    }
  }
}

/**
 * Generate the lib/codegen-registry.ts file with auto-generated templates
 */
function generateCodegenRegistry(): void {
  const entries = Array.from(generatedCodegenTemplates.entries());

  if (entries.length === 0) {
    console.log("No codegen templates generated");
    return;
  }

  // Generate template string literals
  const templateEntries = entries
    .map(([actionId, { template }]) => {
      // Escape backticks and ${} in the template for safe embedding
      const escapedTemplate = template
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$\{/g, "\\${");
      return `  "${ actionId }": \`${ escapedTemplate }\`,`;
    })
    .join("\n\n");

  const content = `/**
 * Codegen Registry (Auto-Generated)
 *
 * This file is automatically generated by scripts/discover-plugins.ts
 * DO NOT EDIT MANUALLY - your changes will be overwritten!
 *
 * Contains auto-generated codegen templates for steps with stepHandler.
 * These templates are used when exporting workflows to standalone projects.
 *
 * Generated templates: ${ entries.length }
 */

import { registerCodegenTemplates } from "next-workflow-builder/plugins";

/**
 * Auto-generated codegen templates
 * Maps action IDs to their generated export code templates
 */
export const AUTO_GENERATED_TEMPLATES: Record<string, string> = {
${ templateEntries }
};

// Register templates into the plugin registry so the package can access them
registerCodegenTemplates(AUTO_GENERATED_TEMPLATES);
`;

  writeFileSync(CODEGEN_REGISTRY_FILE, content, "utf-8");
  console.log(
    `Generated lib/codegen-registry.ts with ${ entries.length } template(s)`,
  );
}

// ============================================================================
// Step Registry Generation
// ============================================================================

/**
 * Generate the lib/step-registry.ts file with step import functions
 * This enables dynamic imports that are statically analyzable by the bundler
 */
async function generateStepRegistry(): Promise<void> {
  const { getAllIntegrations, computeActionId } = await import(
    "../plugins/registry"
    );
  const { LEGACY_ACTION_MAPPINGS } = await import("../plugins/legacy-mappings");
  const integrations = getAllIntegrations();
  console.log("Generating step registry for integrations...");

  // Collect all action -> step mappings
  const stepEntries: Array<{
    actionId: string;
    label: string;
    integration: string;
    stepImportPath: string;
    stepFunction: string;
  }> = [];

  for (const integration of integrations) {
    for (const action of integration.actions) {
      const fullActionId = computeActionId(integration.type, action.slug);
      stepEntries.push({
        actionId: fullActionId,
        label: action.label,
        integration: integration.type,
        stepImportPath: action.stepImportPath,
        stepFunction: action.stepFunction,
      });
    }
  }

  // Build reverse mapping from action IDs to legacy labels
  const legacyLabelsForAction: Record<string, string[]> = {};
  for (const [legacyLabel, actionId] of Object.entries(
    LEGACY_ACTION_MAPPINGS,
  )) {
    if (!legacyLabelsForAction[actionId]) {
      legacyLabelsForAction[actionId] = [];
    }
    legacyLabelsForAction[actionId].push(legacyLabel);
  }

  // Generate the step importer map with static imports
  // Include both namespaced IDs and legacy label-based IDs for backward compatibility
  const importerEntries = stepEntries
    .flatMap(({ actionId, integration, stepImportPath, stepFunction }) => {
      // For npm-installed plugins, use the package specifier; for local plugins, use @/plugins/
      const npmSpec = npmPluginSpecifiers.get(integration);
      const importPath = npmSpec
        ? `${ npmSpec }/steps/${ stepImportPath }`
        : `@/plugins/${ integration }/steps/${ stepImportPath }`;

      const entries = [
        `  "${ actionId }": {
    importer: () => import("${ importPath }"),
    stepFunction: "${ stepFunction }",
  },`,
      ];
      // Add entries for all legacy labels that map to this action
      const legacyLabels = legacyLabelsForAction[actionId] || [];
      for (const legacyLabel of legacyLabels) {
        entries.push(
          `  "${ legacyLabel }": {
    importer: () => import("${ importPath }"),
    stepFunction: "${ stepFunction }",
  },`,
        );
      }
      return entries;
    })
    .join("\n");

  // Generate the action labels map for displaying human-readable names
  const labelEntries = stepEntries
    .map(({ actionId, label }) => `  "${ actionId }": "${ label }",`)
    .join("\n");

  // Also add legacy label mappings to the labels map
  const legacyLabelEntries = Object.entries(legacyLabelsForAction)
    .flatMap(([actionId, legacyLabels]) => {
      const entry = stepEntries.find((e) => e.actionId === actionId);
      if (!entry) {
        return [];
      }
      return legacyLabels.map(
        (legacyLabel) => `  "${ legacyLabel }": "${ entry.label }",`,
      );
    })
    .join("\n");

  const content = `/**
 * Step Registry (Auto-Generated)
 *
 * This file is automatically generated by scripts/discover-plugins.ts
 * DO NOT EDIT MANUALLY - your changes will be overwritten!
 *
 * This registry enables dynamic step imports that are statically analyzable
 * by the bundler. Each action type maps to its step importer function.
 *
 * Generated entries: ${ stepEntries.length }
 */

import "server-only";

// biome-ignore lint/suspicious/noExplicitAny: Dynamic step module types - step functions take any input
export type StepFunction = (input: any) => Promise<any>;

// Step modules may contain the step function plus other exports (types, constants, etc.)
// biome-ignore lint/suspicious/noExplicitAny: Dynamic module with mixed exports
export type StepModule = Record<string, any>;

export type StepImporter = {
  importer: () => Promise<StepModule>;
  stepFunction: string;
};

/**
 * Plugin step importers - maps action types to their step import functions
 * These imports are statically analyzable by the bundler
 */
export const PLUGIN_STEP_IMPORTERS: Record<string, StepImporter> = {
${ importerEntries }
};

/**
 * Action labels - maps action IDs to human-readable labels
 * Used for displaying friendly names in the UI (e.g., Runs tab)
 */
export const ACTION_LABELS: Record<string, string> = {
${ labelEntries }
${ legacyLabelEntries }
};

/**
 * Get a step importer for an action type
 */
export function getStepImporter(actionType: string): StepImporter | undefined {
  return PLUGIN_STEP_IMPORTERS[actionType];
}

/**
 * Get the human-readable label for an action type
 */
export function getActionLabel(actionType: string): string | undefined {
  return ACTION_LABELS[actionType];
}
`;

  writeFileSync(STEP_REGISTRY_FILE, content, "utf-8");
  console.log(
    `Generated lib/step-registry.ts with ${ stepEntries.length } step(s)`,
  );
}

/**
 * Generate the lib/output-display-configs.ts file (client-safe)
 * This file can be imported in client components
 */
async function generateOutputDisplayConfigs(): Promise<void> {
  const { getAllIntegrations, computeActionId } = await import(
    "../plugins/registry"
    );
  const integrations = getAllIntegrations();

  // Collect output configs (only built-in types, not component types)
  const outputConfigs: Array<{
    actionId: string;
    type: string;
    field: string;
  }> = [];

  for (const integration of integrations) {
    for (const action of integration.actions) {
      // Only include built-in config types (image/video/url), not component types
      if (action.outputConfig && action.outputConfig.type !== "component") {
        outputConfigs.push({
          actionId: computeActionId(integration.type, action.slug),
          type: action.outputConfig.type,
          field: action.outputConfig.field,
        });
      }
    }
  }

  // Generate output config entries
  const outputConfigEntries = outputConfigs
    .map(
      ({ actionId, type, field }) =>
        `  "${ actionId }": { type: "${ type }", field: "${ field }" },`,
    )
    .join("\n");

  const content = `/**
 * Output Display Configs (Auto-Generated)
 *
 * This file is automatically generated by scripts/discover-plugins.ts
 * DO NOT EDIT MANUALLY - your changes will be overwritten!
 *
 * This file is CLIENT-SAFE and can be imported in client components.
 * It maps action IDs to their output display configuration.
 *
 * Generated configs: ${ outputConfigs.length }
 */

import { registerOutputDisplayConfigs } from "next-workflow-builder/plugins";

export type OutputDisplayConfig = {
  type: "image" | "video" | "url";
  field: string;
};

/**
 * Output display configs - maps action IDs to their display configuration
 * Used for rendering outputs in the workflow runs panel
 */
export const OUTPUT_DISPLAY_CONFIGS: Record<string, OutputDisplayConfig> = {
${ outputConfigEntries }
};

// Register configs into the plugin registry so the package can access them
registerOutputDisplayConfigs(OUTPUT_DISPLAY_CONFIGS);
`;

  writeFileSync(OUTPUT_CONFIGS_FILE, content, "utf-8");
  console.log(
    `Generated lib/output-display-configs.ts with ${ outputConfigs.length } config(s)`,
  );
}

// ============================================================================
// Route Registry Generation
// ============================================================================

/**
 * Generate the lib/route-registry.ts file with plugin route definitions
 * This enables plugin-provided API routes to be merged into the workflow API handler
 */
async function generateRouteRegistry(): Promise<void> {
  const { getAllIntegrations } = await import("../plugins/registry");
  const integrations = getAllIntegrations();

  // Collect all route entries from plugins
  const routeEntries: Array<{
    path: string;
    methods: string[];
    handler: string;
    handlerImportPath: string;
    pluginType: string;
  }> = [];

  for (const integration of integrations) {
    if (!integration.routes) continue;
    for (const route of integration.routes) {
      routeEntries.push({
        ...route,
        pluginType: integration.type,
      });
    }
  }

  if (routeEntries.length === 0) {
    // Write an empty registry
    const content = `/**
 * Route Registry (Auto-Generated)
 *
 * This file is automatically generated by scripts/discover-plugins.ts
 * DO NOT EDIT MANUALLY - your changes will be overwritten!
 *
 * No plugin routes found.
 */

import "server-only";
import type { RouteDefinition } from "next-workflow-builder";

const PLUGIN_ROUTES: RouteDefinition[] = [];

export default PLUGIN_ROUTES;
`;
    writeFileSync(ROUTE_REGISTRY_FILE, content, "utf-8");
    console.log("Generated lib/route-registry.ts with 0 route(s)");
    return;
  }

  // Generate import + route definition entries
  const importLines: string[] = [];
  const routeDefLines: string[] = [];

  for (const entry of routeEntries) {
    const npmSpec = npmPluginSpecifiers.get(entry.pluginType);
    const importPath = npmSpec
      ? `${ npmSpec }/${ entry.handlerImportPath }`
      : `@/plugins/${ entry.pluginType }/${ entry.handlerImportPath }`;
    const methodsStr = entry.methods.map((m) => `"${ m }"`).join(", ");

    importLines.push(`import { ${ entry.handler } } from "${ importPath }";`);
    routeDefLines.push(
      `  { path: "${ entry.path }", handler: ${ entry.handler }, methods: [${ methodsStr }] },`,
    );
  }

  const content = `/**
 * Route Registry (Auto-Generated)
 *
 * This file is automatically generated by scripts/discover-plugins.ts
 * DO NOT EDIT MANUALLY - your changes will be overwritten!
 *
 * This file is SERVER-ONLY. Plugin route handlers are imported statically
 * so the bundler can tree-shake unused code.
 *
 * Generated routes: ${ routeEntries.length }
 */

import "server-only";
import type { RouteDefinition } from "next-workflow-builder";
${ importLines.join("\n") }

const PLUGIN_ROUTES: RouteDefinition[] = [
${ routeDefLines.join("\n") }
];

export default PLUGIN_ROUTES;
`;

  writeFileSync(ROUTE_REGISTRY_FILE, content, "utf-8");
  console.log(
    `Generated lib/route-registry.ts with ${ routeEntries.length } route(s)`,
  );
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Ensure plugins directory exists
  if (!existsSync(PLUGINS_DIR)) {
    mkdirSync(PLUGINS_DIR, { recursive: true });
  }

  // 1. Scaffold plugins/index.ts if it doesn't exist (user-managed, never overwritten)
  console.log("Checking plugins/index.ts...");
  scaffoldIndexFile();

  // 2. Import plugins/index.ts to populate the registry (handles both local and npm plugins)
  await importPluginsFromIndex();

  // 3. Ensure auto-generated files are gitignored
  ensureGitignore();

  // 4. Generate all other files from the registry
  console.log("Updating README.md...");
  await updateReadme();

  console.log("Generating lib/types/integration.ts...");
  await generateTypesFile();

  console.log("Generating lib/step-registry.ts...");
  await generateStepRegistry();

  console.log("Generating lib/output-display-configs.ts...");
  await generateOutputDisplayConfigs();

  console.log("\nProcessing step files for codegen templates...");
  await processStepFilesForCodegen();

  console.log("Generating lib/codegen-registry.ts...");
  generateCodegenRegistry();

  console.log("Generating lib/route-registry.ts...");
  await generateRouteRegistry();

  console.log("Done! Plugin registry updated.\n");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
