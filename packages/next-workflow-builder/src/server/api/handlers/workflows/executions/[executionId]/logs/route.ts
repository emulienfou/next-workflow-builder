import { desc, eq } from "drizzle-orm";
import { redactSensitiveData } from "../../../../../../../lib/utils/redact.js";
import { workflowExecutionLogs, workflowExecutions } from "../../../../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../../../../handler-utils.js";
import type { RouteHandler } from "../../../../../types.js";

export const executionLogs: RouteHandler = async (route, ctx) => {
  try {
    // segments: ['executions', '<executionId>', 'logs']
    const executionId = route.segments[1];

    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const execution = await ctx.db.query.workflowExecutions.findFirst({
      where: eq(workflowExecutions.id, executionId),
      with: { workflow: true },
    });

    if (!execution) {
      return errorResponse("Execution not found", 404);
    }

    if (execution.workflow.userId !== session.user.id) {
      return errorResponse("Forbidden", 403);
    }

    const logs = await ctx.db.query.workflowExecutionLogs.findMany({
      where: eq(workflowExecutionLogs.executionId, executionId),
      orderBy: [desc(workflowExecutionLogs.timestamp)],
    });

    // Defense-in-depth redaction
    const redactedLogs = logs.map((log: { input: unknown; output: unknown }) => ({
      ...log,
      input: redactSensitiveData(log.input),
      output: redactSensitiveData(log.output),
    }));

    return jsonResponse({ execution, logs: redactedLogs });
  } catch (error) {
    console.error("Failed to get execution logs:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to get execution logs",
      500,
    );
  }
};
