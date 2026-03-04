/**
 * Executable step function for Switch action
 * Routes workflow based on rules or expression matching
 * Similar to n8n's Switch node
 */
import "server-only";

import { type StepInput, withStepLogging } from "../../server";

export type SwitchMode = "rules" | "expression";

export type SwitchInput = StepInput & {
  /** Switch mode */
  mode?: SwitchMode;
  /** Value to match against case values (expression mode) */
  switchValue?: string;
  /** Route names (flat keys: routeName0, routeName1, etc.) */
  routeName0?: string;
  routeName1?: string;
  routeName2?: string;
  routeName3?: string;
  /** Route conditions — booleans pre-resolved by executor (rules mode) */
  routeCondition0?: boolean;
  routeCondition1?: boolean;
  routeCondition2?: boolean;
  routeCondition3?: boolean;
  /** Route case values (expression mode) */
  routeCaseValue0?: string;
  routeCaseValue1?: string;
  routeCaseValue2?: string;
  routeCaseValue3?: string;
};

export type SwitchResult = {
  /** Index of the matched route (0-3), or -1 for default/fallback */
  matchedRouteIndex: number;
  /** Name of the matched route */
  matchedRouteName: string;
  /** Whether the fallback/default route was used */
  isDefault: boolean;
};

type Route = {
  name: string;
  condition?: boolean;
  caseValue?: string;
};

function buildRoutes(input: SwitchInput): Route[] {
  const routes: Route[] = [];
  for (let i = 0; i < 4; i++) {
    const name = (input as Record<string, unknown>)[`routeName${i}`] as string | undefined;
    const condition = (input as Record<string, unknown>)[`routeCondition${i}`] as boolean | undefined;
    const caseValue = (input as Record<string, unknown>)[`routeCaseValue${i}`] as string | undefined;
    routes.push({
      name: name || `Route ${i + 1}`,
      condition,
      caseValue,
    });
  }
  return routes;
}

function evaluateSwitch(input: SwitchInput): SwitchResult {
  const mode = input.mode || "rules";
  const routes = buildRoutes(input);

  if (mode === "rules") {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].condition === true) {
        return {
          matchedRouteIndex: i,
          matchedRouteName: routes[i].name,
          isDefault: false,
        };
      }
    }
  } else {
    // expression mode — string equality
    const switchValue = String(input.switchValue ?? "");
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].caseValue !== undefined && String(routes[i].caseValue) === switchValue) {
        return {
          matchedRouteIndex: i,
          matchedRouteName: routes[i].name,
          isDefault: false,
        };
      }
    }
  }

  // No match — fallback
  return {
    matchedRouteIndex: -1,
    matchedRouteName: "Default",
    isDefault: true,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function switchStep(input: SwitchInput): Promise<SwitchResult> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(evaluateSwitch(input)));
}

switchStep.maxRetries = 0;
