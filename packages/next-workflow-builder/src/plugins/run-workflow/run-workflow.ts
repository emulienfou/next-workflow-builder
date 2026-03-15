/**
 * Executable step function for Run Workflow action
 * Executes another workflow internally, bypassing HTTP entirely
 */
import "server-only";

import { eq } from "drizzle-orm";
import { type StepInput, withStepLogging } from "../../server";
import { db } from "../../server/db";
import { workflows, workflowExecutions } from "../../server/db/schema";
import { generateId } from "../../server/lib/utils/id";
import { executeWorkflow } from "../../server/lib/workflow-executor.workflow";

export type RunWorkflowInput = StepInput & {
  /** The ID of the workflow to execute */
  workflowId?: string;
  /** Optional JSON input to pass to the sub-workflow */
  input?: string;
};

export type RunWorkflowResult =
  | { success: true; executionId: string; output: unknown }
  | { success: false; error: string };

async function runWorkflow(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  const { workflowId, input: rawInput } = input;

  if (!workflowId) {
    return { success: false, error: "No workflow selected" };
  }

  // Fetch the target workflow
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (!workflow) {
    return { success: false, error: `Workflow "${workflowId}" not found` };
  }

  // Parse optional input
  let triggerInput: Record<string, unknown> = {};
  if (rawInput && rawInput.trim()) {
    try {
      triggerInput = JSON.parse(rawInput);
    } catch {
      return { success: false, error: `Invalid JSON input: ${rawInput}` };
    }
  }

  // Create an execution record for the sub-workflow
  const executionId = generateId();
  await db.insert(workflowExecutions).values({
    id: executionId,
    workflowId,
    userId: workflow.userId,
    status: "running",
    input: triggerInput,
  });

  // Execute the workflow inline (wait for completion)
  const result = await executeWorkflow({
    nodes: workflow.nodes,
    edges: workflow.edges,
    triggerInput,
    executionId,
    workflowId,
  });

  if (result.success) {
    // Extract the last node's output as the sub-workflow output
    const lastOutput = Object.values(result.outputs || {}).at(-1)?.data;
    return {
      success: true,
      executionId,
      output: lastOutput,
    };
  }

  return {
    success: false,
    error: result.error || "Sub-workflow execution failed",
  };
}

export async function runWorkflowStep(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  "use step";
  return withStepLogging(input, () => runWorkflow(input));
}
runWorkflowStep.maxRetries = 0;
