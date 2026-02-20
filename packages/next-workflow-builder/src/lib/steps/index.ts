/**
 * Step registry - maps action types to executable step functions
 * This allows the workflow executor to call step functions directly
 * without code generation or eval()
 */

import type { conditionStep } from "../../plugins/condition/steps/evaluate.js";
import type { databaseQueryStep } from "../../plugins/database/steps/query.js";
import type { loopStep } from "../../plugins/loop/steps/iterate.js";
import type { switchStep } from "../../plugins/switch/steps/evaluate.js";
import type { httpRequestStep } from "./http-request";

// Step function type
export type StepFunction = (input: Record<string, unknown>) => Promise<unknown>;

// Step modules may contain the step function plus other exports (types, constants, etc.)
// biome-ignore lint/suspicious/noExplicitAny: Dynamic module with mixed exports
export type StepModule = Record<string, any>;

export type StepImporter = {
  importer: () => Promise<StepModule>;
  stepFunction: string;
};

// Registry of all available steps
export const stepRegistry: Record<string, StepFunction> = {
  "HTTP Request": async (input) =>
    (await import("./http-request")).httpRequestStep(
      input as Parameters<typeof httpRequestStep>[0],
    ),
  "Database Query": async (input) =>
    (await import("../../plugins/database/steps/query")).databaseQueryStep(
      input as Parameters<typeof databaseQueryStep>[0],
    ),
  Condition: async (input) =>
    (await import("../../plugins/condition/steps/evaluate")).conditionStep(
      input as Parameters<typeof conditionStep>[0],
    ),
  Loop: async (input) =>
    (await import("../../plugins/loop/steps/iterate")).loopStep(
      input as Parameters<typeof loopStep>[0],
    ),
  Switch: async (input) =>
    (await import("../../plugins/switch/steps/evaluate")).switchStep(
      input as Parameters<typeof switchStep>[0],
    ),
};

// Helper to check if a step exists
export function hasStep(actionType: string): boolean {
  return actionType in stepRegistry;
}

// Helper to get a step function
export function getStep(actionType: string): StepFunction | undefined {
  return stepRegistry[actionType];
}
