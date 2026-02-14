import { and, eq } from "drizzle-orm";
import { apiKeys } from "../../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../../handler-utils.js";
import type { RouteHandler } from "../../../types.js";

export const apiKeyHandler: RouteHandler = async (route, ctx) => {
  try {
    const keyId = route.segments[1];

    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Delete the key (only if it belongs to the user)
    const result = await ctx.db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)))
      .returning({ id: apiKeys.id });

    if (result.length === 0) {
      return errorResponse("API key not found", 404);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return errorResponse("Failed to delete API key", 500);
  }
};
