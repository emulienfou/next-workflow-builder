import { desc, eq } from "drizzle-orm";
import { workflows } from "../../../db/schema.js";
import { errorResponse, getOptionalSession, jsonResponse, serializeWorkflow } from "../../handler-utils.js";
import type { RouteHandler } from "../../types.js";

export const listWorkflows: RouteHandler = async (route, ctx) => {
  try {
    const session = await getOptionalSession(ctx, route.request);

    if (!session?.user) {
      return jsonResponse([]);
    }

    const userWorkflows = await ctx.db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, session.user.id))
      .orderBy(desc(workflows.updatedAt));

    return jsonResponse(userWorkflows.map(serializeWorkflow));
  } catch (error) {
    console.error("Failed to get workflows:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to get workflows",
      500,
    );
  }
};
