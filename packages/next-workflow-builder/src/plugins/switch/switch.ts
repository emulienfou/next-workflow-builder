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
  /** Number of routes (default 4 for backwards compatibility) */
  routeCount?: number;
  /** Dynamic route keys: routeName0..N, routeCondition0..N, routeCaseValue0..N */
  [key: string]: unknown;
};

export type SwitchResult = {
  /** Index of the matched route (0-based), or -1 for default/fallback */
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
  const count = Number(input.routeCount) || 4;
  const routes: Route[] = [];
  for (let i = 0; i < count; i++) {
    const name = input[`routeName${i}`] as string | undefined;
    const condition = input[`routeCondition${i}`] as boolean | undefined;
    const caseValue = input[`routeCaseValue${i}`] as string | undefined;
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
