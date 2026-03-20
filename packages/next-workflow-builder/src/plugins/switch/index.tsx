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
  routeCount?: number;
  [key: string]: unknown;
}) {
  "use step";

  const mode = input.mode || "rules";
  const count = Number(input.routeCount) || 4;
  const routes = [];
  for (let i = 0; i < count; i++) {
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
