import { IntegrationType } from "../plugins/types";

/**
 * Select Option
 * Used for select/dropdown fields
 */
export type SelectOption = {
  value: string;
  label: string;
};

/**
 * Base Action Config Field
 * Declarative definition of a config field for an action
 */
export type ActionConfigFieldBase = {
  // Unique key for this field in the config object
  key: string;

  // Human-readable label
  label: string;

  // Field type
  type:
    | "template-input" // TemplateBadgeInput - supports {{variable}}
    | "template-textarea" // TemplateBadgeTextarea - supports {{variable}}
    | "text" // Regular text input
    | "number" // Number input
    | "select" // Dropdown select
    | "schema-builder"; // Schema builder for structured output

  // Placeholder text
  placeholder?: string;

  // Default value
  defaultValue?: string;

  // Example value for AI prompt generation
  example?: string;

  // For select fields: list of options
  options?: SelectOption[];

  // Number of rows (for textarea)
  rows?: number;

  // Min value (for number fields)
  min?: number;

  // Whether this field is required (defaults to false)
  required?: boolean;

  // Conditional rendering: only show if another field has a specific value
  showWhen?: {
    field: string;
    equals: string;
  };
};

/**
 * Config Field Group
 * Groups related fields together in a collapsible section
 */
export type ActionConfigFieldGroup = {
  // Human-readable label for the group
  label: string;

  // Field type (always "group" for groups)
  type: "group";

  // Nested fields within this group
  fields: ActionConfigFieldBase[];

  // Whether the group is expanded by default (defaults to false)
  defaultExpanded?: boolean;
};

/**
 * Action Config Field
 * Can be either a regular field or a group of fields
 */
export type ActionConfigField = ActionConfigFieldBase | ActionConfigFieldGroup;

/**
 * Output Field Definition
 * Describes an output field available for template autocomplete
 */
export type OutputField = {
  field: string;
  description: string;
};

/**
 * Result Component Props
 * Props passed to custom result components
 */
export type ResultComponentProps = {
  output: unknown;
  input?: unknown;
};

/**
 * Output Display Config
 * Specifies how to render step output in the workflow runs panel
 */
export type OutputDisplayConfig =
  | {
  // Built-in display types
  type: "image" | "video" | "url";
  // Field name in the step output that contains the displayable value
  field: string;
}
  | {
  // Custom component display
  type: "component";
  // React component to render the output
  component: React.ComponentType<ResultComponentProps>;
};

/**
 * Action Definition
 * Describes a single action provided by a plugin
 */
export type PluginAction = {
  // Unique slug for this action (e.g., "send-email")
  // Full action ID will be computed as `{integration}/{slug}` (e.g., "resend/send-email")
  slug: string;

  // Human-readable label (e.g., "Send Email")
  label: string;

  // Description of what this action does
  description: string;

  // Category for grouping in UI
  category: string;

  // Step configuration
  stepFunction: string; // Name of the exported function in the step file
  stepImportPath: string; // Path to import from, relative to plugins/[plugin-name]/steps/

  // Config fields for the action (declarative definition)
  configFields: ActionConfigField[];

  // Output fields for template autocomplete (what this action returns)
  outputFields?: OutputField[];

  // Output display configuration (how to render output in workflow runs panel)
  outputConfig?: OutputDisplayConfig;

  // Code generation template (the actual template string, not a path)
  // Optional - if not provided, will fall back to auto-generated template
  // from steps that export _exportCore
  codegenTemplate?: string;
};

/**
 * Integration Plugin Definition
 * All information needed to register a new integration in one place
 */
export type IntegrationPlugin = {
  // Basic info
  type: IntegrationType;
  label: string;
  description: string;

  // Icon component (should be exported from plugins/[name]/icon.tsx)
  icon: React.ComponentType<{ className?: string }>;

  // Form fields for the integration dialog
  formFields: Array<{
    id: string;
    label: string;
    type: "text" | "password" | "url";
    placeholder?: string;
    helpText?: string;
    helpLink?: { text: string; url: string };
    configKey: string; // Which key in IntegrationConfig to store the value
    envVar?: string; // Environment variable this field maps to (e.g., "RESEND_API_KEY")
  }>;

  // Testing configuration (lazy-loaded to avoid bundling Node.js packages in client)
  testConfig?: {
    // Returns a promise that resolves to the test function
    // This allows the test module to be loaded only on the server when needed
    getTestFunction: () => Promise<
      (
        credentials: Record<string, string>,
      ) => Promise<{ success: boolean; error?: string }>
    >;
  };

  // Avoid using this field. Plugins should use fetch instead of SDK dependencies
  // to reduce supply chain attack surface. Only use for codegen if absolutely necessary.
  dependencies?: Record<string, string>;

  // Actions provided by this integration
  actions: PluginAction[];
};

/**
 * Action with full ID
 * Includes the computed full action ID (integration/slug)
 */
export type ActionWithFullId = PluginAction & {
  id: string; // Full action ID: {integration}/{slug}
  integration: IntegrationType;
};

// WorkflowCredentials is now a generic record since plugins define their own keys
export type WorkflowCredentials = Record<string, string | undefined>;

// Step modules may contain the step function plus other exports (types, constants, etc.)
// biome-ignore lint/suspicious/noExplicitAny: Dynamic module with mixed exports
export type StepModule = Record<string, any>;

export type StepImporter = {
  importer: () => Promise<StepModule>;
  stepFunction: string;
};
