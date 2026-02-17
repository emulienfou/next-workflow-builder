import type { IntegrationPlugin } from "next-workflow-builder/plugins";
import { registerIntegration } from "next-workflow-builder/plugins";
import { SwitchIcon } from "./icon";

const switchPlugin: IntegrationPlugin = {
  type: "switch",
  label: "Switch",
  description: "Route data to different outputs based on rules or expressions",
  icon: SwitchIcon,

  formFields: [],

  actions: [
    {
      slug: "route",
      label: "Switch",
      description:
        "Evaluate rules or expressions to route data to different outputs",
      category: "System",
      stepFunction: "switchStep",
      stepImportPath: "evaluate",
      configFields: [
        {
          key: "mode",
          label: "Mode",
          type: "select",
          options: [
            { value: "rules", label: "Rules" },
            { value: "expression", label: "Expression" },
          ],
          defaultValue: "rules",
        },
        {
          key: "value",
          label: "Value to Evaluate",
          type: "template-input",
          placeholder: "e.g., {{PreviousNode.status}}, {{Trigger.type}}",
          showWhen: { field: "mode", equals: "rules" },
        },
        {
          key: "rules",
          label: "Rules (JSON array)",
          type: "template-textarea",
          placeholder:
            '[{"output": 0, "operator": "equals", "value": "active", "name": "Active"}, {"output": 1, "operator": "equals", "value": "inactive", "name": "Inactive"}]',
          rows: 5,
          showWhen: { field: "mode", equals: "rules" },
        },
        {
          key: "outputExpression",
          label: "Output Index Expression",
          type: "template-input",
          placeholder: "e.g., {{PreviousNode.outputIndex}}",
          showWhen: { field: "mode", equals: "expression" },
        },
        {
          key: "fallbackOutput",
          label: "When No Rule Matches",
          type: "select",
          options: [
            { value: "none", label: "Do nothing (discard)" },
            { value: "fallback", label: "Route to fallback output" },
          ],
          defaultValue: "none",
        },
      ],
      outputFields: [
        {
          field: "matchedOutput",
          description: "Index of the matched output (0-based), or -1 if none",
        },
        {
          field: "matchedRuleName",
          description: "Name of the matched rule, if set",
        },
        {
          field: "matchedRuleIndex",
          description: "Index of the matched rule in the rules array",
        },
        { field: "value", description: "The value that was evaluated" },
        { field: "outputCount", description: "Total number of outputs" },
      ],
    },
  ],
};

registerIntegration(switchPlugin);

export default switchPlugin;
