import { ListOrdered } from "lucide-react";
import { ActionType } from "../../client/components/workflow/config/action-grid";

const runWorkflowsInSequenceAction: ActionType = {
  id: "Run Workflows in Sequence",
  label: "Run Workflows in Sequence",
  description: "Execute multiple workflows one after another in order",
  category: "System",
  icon: <ListOrdered className="size-12 text-emerald-300" strokeWidth={ 1.5 }/>,
  codeGenerator: `export async function runWorkflowsInSequenceStep(input: {
  workflowIds: string[];
  continueOnFailure?: boolean;
  input?: string;
}) {
  "use step";

  // Note: Run Workflows in Sequence is only available in the visual builder.
  // It executes multiple workflows internally in order and returns their outputs.
  throw new Error("Run Workflows in Sequence is not supported in exported code. Use HTTP Request instead.");
}`,
};

export { runWorkflowsInSequenceAction };
