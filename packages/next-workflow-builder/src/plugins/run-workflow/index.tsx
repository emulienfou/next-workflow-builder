import { WorkflowIcon } from "lucide-react";
import { ActionType } from "../../client/components/workflow/config/action-grid";

const runWorkflowAction: ActionType = {
  id: "Run Workflow",
  label: "Run Workflow",
  description: "Execute another workflow and wait for it to complete",
  category: "System",
  icon: <WorkflowIcon className="size-12 text-emerald-300" strokeWidth={ 1.5 }/>,
  codeGenerator: `export async function runWorkflowStep(input: {
  workflowId: string;
  input?: string;
}) {
  "use step";

  // Note: Run Workflow is only available in the visual builder.
  // It executes another workflow internally and returns its output.
  throw new Error("Run Workflow is not supported in exported code. Use HTTP Request instead.");
}`,
};

export { runWorkflowAction };
