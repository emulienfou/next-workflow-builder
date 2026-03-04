import { ArrowLeftRight } from "lucide-react";
import { ActionType } from "../../client/components/workflow/config/action-grid";

const switchAction: ActionType = {
  id: "Switch",
  label: "Switch",
  description: "Route based on rules or values",
  category: "System",
  icon: <ArrowLeftRight className="size-12 text-violet-300" strokeWidth={ 1.5 }/>,
  codeGenerator: `export async function switchStep(input: {
  mode: "rules" | "expression";
  switchValue?: string;
  routeName0?: string;
  routeName1?: string;
  routeName2?: string;
  routeName3?: string;
  routeCondition0?: boolean;
  routeCondition1?: boolean;
  routeCondition2?: boolean;
  routeCondition3?: boolean;
  routeCaseValue0?: string;
  routeCaseValue1?: string;
  routeCaseValue2?: string;
  routeCaseValue3?: string;
}) {
  "use step";

  const mode = input.mode || "rules";
  const routes = [];
  for (let i = 0; i < 4; i++) {
    const name = (input as Record<string, unknown>)[\`routeName\${i}\`] as string | undefined;
    const condition = (input as Record<string, unknown>)[\`routeCondition\${i}\`] as boolean | undefined;
    const caseValue = (input as Record<string, unknown>)[\`routeCaseValue\${i}\`] as string | undefined;
    routes.push({ name: name || \`Route \${i + 1}\`, condition, caseValue });
  }

  if (mode === "rules") {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].condition === true) {
        return { matchedRouteIndex: i, matchedRouteName: routes[i].name, isDefault: false };
      }
    }
  } else {
    const switchValue = String(input.switchValue ?? "");
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].caseValue !== undefined && String(routes[i].caseValue) === switchValue) {
        return { matchedRouteIndex: i, matchedRouteName: routes[i].name, isDefault: false };
      }
    }
  }

  return { matchedRouteIndex: -1, matchedRouteName: "Default", isDefault: true };
}`,
};

export { switchAction };
