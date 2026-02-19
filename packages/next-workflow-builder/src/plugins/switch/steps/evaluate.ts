/**
 * Executable step function for Switch action
 * Evaluates routing rules and returns the matched output index
 * Similar to n8n's Switch node
 */
import "server-only";
import { StepInput, withStepLogging } from "../../../lib/steps/step-handler";

export type SwitchRule = {
  /** Which output index this rule routes to */
  output: number;
  /** Comparison operator */
  operator: string;
  /** Value to compare against */
  value: string;
  /** Optional human-readable name for the rule */
  name?: string;
};

export type SwitchInput = StepInput & {
  /** Mode: "rules" or "expression" */
  mode: string;
  /** Value to evaluate against rules (rules mode) */
  value?: string;
  /** Parsed array of routing rules (rules mode) */
  rules?: SwitchRule[];
  /** Expression that resolves to an output index (expression mode) */
  outputIndex?: number;
  /** Fallback behavior: "none" or "fallback" */
  fallbackOutput?: string;
};

export type SwitchResult = {
  /** Matched output index, or -1 if no match */
  matchedOutput: number;
  /** Index of the matched rule in the rules array, or -1 */
  matchedRuleIndex: number;
  /** Name of the matched rule, if set */
  matchedRuleName: string;
  /** The value that was evaluated */
  value: string;
  /** Total number of outputs (max output index + 1, or expression result + 1) */
  outputCount: number;
};

function applyOperator(
  value: string,
  operator: string,
  operand: string,
): boolean {
  switch (operator) {
    case "equals":
      return value === operand;
    case "notEquals":
      return value !== operand;
    case "contains":
      return value.includes(operand);
    case "notContains":
      return !value.includes(operand);
    case "greaterThan":
      return Number(value) > Number(operand);
    case "lessThan":
      return Number(value) < Number(operand);
    case "startsWith":
      return value.startsWith(operand);
    case "endsWith":
      return value.endsWith(operand);
    case "regex":
      try {
        return new RegExp(operand).test(value);
      } catch {
        return false;
      }
    case "isEmpty":
      return value === "" || value === null || value === undefined;
    case "isNotEmpty":
      return value !== "" && value !== null && value !== undefined;
    default:
      return false;
  }
}

function evaluateSwitch(input: SwitchInput): SwitchResult {
  const mode = input.mode || "rules";

  // Expression mode: outputIndex is already resolved
  if (mode === "expression") {
    const outputIndex =
      typeof input.outputIndex === "number" ? input.outputIndex : -1;
    return {
      matchedOutput: outputIndex,
      matchedRuleIndex: -1,
      matchedRuleName: "",
      value: String(input.outputIndex ?? ""),
      outputCount: outputIndex >= 0 ? outputIndex + 1 : 0,
    };
  }

  // Rules mode: evaluate value against each rule
  const value = String(input.value ?? "");
  const rules = Array.isArray(input.rules) ? input.rules : [];

  let maxOutput = 0;
  for (const rule of rules) {
    if (rule.output > maxOutput) {
      maxOutput = rule.output;
    }
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (applyOperator(value, rule.operator, rule.value)) {
      return {
        matchedOutput: rule.output,
        matchedRuleIndex: i,
        matchedRuleName: rule.name || "",
        value,
        outputCount: maxOutput + 1,
      };
    }
  }

  // No match
  return {
    matchedOutput: -1,
    matchedRuleIndex: -1,
    matchedRuleName: "",
    value,
    outputCount: maxOutput + 1,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function switchStep(input: SwitchInput): Promise<SwitchResult> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(evaluateSwitch(input)));
}

switchStep.maxRetries = 0;
