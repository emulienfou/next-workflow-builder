import { eq } from "drizzle-orm";
import { accounts, users } from "../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../types.js";

export const userHandler: RouteHandler = async (route, ctx) => {
  switch (route.method) {
    case "GET":
      return getUser(route, ctx);
    case "PATCH":
      return updateUser(route, ctx);
    default:
      return errorResponse("Method not allowed", 405);
  }
};

async function getUser(
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const userData = await ctx.db.query.user.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        isAnonymous: true,
      },
    });

    if (!userData) {
      return errorResponse("User not found", 404);
    }

    // Get the user's account to determine auth provider
    const userAccount = await ctx.db.query.account.findFirst({
      where: eq(accounts.userId, session.user.id),
      columns: {
        providerId: true,
      },
    });

    return jsonResponse({
      ...userData,
      providerId: userAccount?.providerId ?? null,
    });
  } catch (error) {
    console.error("Failed to get user:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to get user",
      500,
    );
  }
}

async function updateUser(
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user is an OAuth user (can't update profile)
    const userAccount = await ctx.db.query.account.findFirst({
      where: eq(accounts.userId, session.user.id),
      columns: {
        providerId: true,
      },
    });

    // Block updates for OAuth users (vercel, github, google, etc.)
    const oauthProviders = ["vercel", "github", "google"];
    if (userAccount && oauthProviders.includes(userAccount.providerId)) {
      return errorResponse("Cannot update profile for OAuth users", 403);
    }

    const body = await route.request.json();
    const updates: { name?: string; email?: string } = {};

    if (body.name !== undefined) {
      updates.name = body.name;
    }
    if (body.email !== undefined) {
      updates.email = body.email;
    }

    await ctx.db.update(users).set(updates).where(eq(users.id, session.user.id));

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to update user:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update user",
      500,
    );
  }
}
