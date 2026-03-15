/**
 * Executable step function for Run Workflows in Sequence action
 * Executes multiple workflows one after another, waiting for each to complete
 */
import "server-only";

import { eq } from "drizzle-orm";
import { type StepInput, withStepLogging } from "../../server";
import { db } from "../../server/db";
import { workflows, workflowExecutions } from "../../server/db/schema";
import { generateId } from "../../server/lib/utils/id";
import { executeWorkflow } from "../../server/lib/workflow-executor.workflow";

export type RunWorkflowsInSequenceInput = StepInput & {
  /** Comma-separated or JSON array of workflow IDs to execute in order */
  workflowIds?: string;
  /** Whether to continue executing remaining workflows if one fails */
  continueOnFailure?: string;
  /** Optional JSON input passed to all workflows */
  input?: string;
};

type WorkflowRunResult = {
  workflowId: string;
  workflowName: string;
  executionId: string;
  success: boolean;
  output?: unknown;
  error?: string;
};

export type RunWorkflowsInSequenceResult =
  | {
  success: true;
  results: WorkflowRunResult[];
  succeeded: number;
  failed: number;
  total: number;
}
  | { success: false; error: string };

function parseWorkflowIds(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) return [];

  // Try JSON array first
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Not JSON — fall through
  }

  // Comma-separated fallback
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function runWorkflowsInSequence(
  input: RunWorkflowsInSequenceInput,
): Promise<RunWorkflowsInSequenceResult> {
  const ids = parseWorkflowIds(input.workflowIds);
  const continueOnFailure = input.continueOnFailure === "true";

  if (ids.length === 0) {
    return { success: false, error: "No workflows selected" };
  }

  // Parse optional shared input
  let triggerInput: Record<string, unknown> = {};
  if (input.input && input.input.trim()) {
    try {
      triggerInput = JSON.parse(input.input);
    } catch {
      return { success: false, error: `Invalid JSON input: ${input.input}` };
    }
  }

  const results: WorkflowRunResult[] = [];

  for (const workflowId of ids) {
    // Fetch the target workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow) {
      const result: WorkflowRunResult = {
        workflowId,
        workflowName: "Unknown",
        executionId: "",
        success: false,
        error: `Workflow "${workflowId}" not found`,
      };
      results.push(result);
      if (!continueOnFailure) break;
      continue;
    }

    // Create an execution record
    const executionId = generateId();
    await db.insert(workflowExecutions).values({
      id: executionId,
      workflowId,
      userId: workflow.userId,
      status: "running",
      input: triggerInput,
    });

    // Execute inline — wait for completion before starting the next
    const execResult = await executeWorkflow({
      nodes: workflow.nodes,
      edges: workflow.edges,
      triggerInput,
      executionId,
      workflowId,
    });

    const lastOutput = Object.values(execResult.outputs || {}).at(-1)?.data;

    const result: WorkflowRunResult = {
      workflowId,
      workflowName: workflow.name,
      executionId,
      success: execResult.success,
      output: lastOutput,
      error: execResult.error,
    };
    results.push(result);

    if (!execResult.success && !continueOnFailure) break;
  }

  return {
    success: true,
    results,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    total: ids.length,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function runWorkflowsInSequenceStep(
  input: RunWorkflowsInSequenceInput,
): Promise<RunWorkflowsInSequenceResult> {
  "use step";
  return withStepLogging(input, () => runWorkflowsInSequence(input));
}
runWorkflowsInSequenceStep.maxRetries = 0;
