import type { StepImporter } from "./server/types";

/**
 * Virtual module resolved at build time by the Next.js config wrapper.
 * Maps to the consumer app's plugins/index.ts via webpack/turbopack alias.
 */
declare module "virtual:workflow-builder-plugins" {}

/**
 * Virtual module resolved at build time by the Next.js config wrapper.
 * Maps to the consumer app's lib/step-registry.ts via webpack/turbopack alias.
 */
declare module "virtual:workflow-builder-step-registry" {
  export function getStepImporter(actionType: string): StepImporter | undefined;
  export function getActionLabel(actionType: string): string | undefined;
}
