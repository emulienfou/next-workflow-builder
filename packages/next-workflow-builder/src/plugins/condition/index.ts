import { GitBranchIcon } from "lucide-react";
import type { IntegrationPlugin } from "../registry";

const conditionPlugin: IntegrationPlugin = {
  type: "condition",
  label: "Condition",
  description: "",
  icon: GitBranchIcon,
  isBuiltIn: true,

  formFields: [],

  actions: [
    {
      slug: "iterate",
      label: "Iterate",
      description: "Split data into batches and iterate over each batch",
      category: "System",
      stepFunction: "iterateStep",
      stepImportPath: "iterate",
      configFields: [],
      outputFields: [],
    },
  ],
};

export default conditionPlugin;
