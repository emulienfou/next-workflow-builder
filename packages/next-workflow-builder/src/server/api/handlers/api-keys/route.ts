import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { apiKeys } from "../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../types.js";

// Generate a secure API key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomPart = randomBytes(24).toString("base64url");
  const key = `wfb_${ randomPart }`;
  const hash = createHash("sha256").update(key).digest("hex");
  const prefix = key.slice(0, 11); // "wfb_" + first 7 chars
  return { key, hash, prefix };
}

export const apiKeysHandler: RouteHandler = async (route, ctx) => {
  switch (route.method) {
    case "GET":
      return listApiKeys(route, ctx);
    case "POST":
      return createApiKey(route, ctx);
    default:
      return errorResponse("Method not allowed", 405);
  }
};

async function listApiKeys(
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const keys = await ctx.db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, session.user.id),
      columns: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
    });

    return jsonResponse(keys);
  } catch (error) {
    console.error("Failed to list API keys:", error);
    return errorResponse("Failed to list API keys", 500);
  }
}

async function createApiKey(
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user is anonymous
    const isAnonymous =
      session.user.name === "Anonymous" ||
      session.user.email?.startsWith("temp-");

    if (isAnonymous) {
      return errorResponse("Anonymous users cannot create API keys", 403);
    }

    const body = await route.request.json().catch(() => ({}));
    const name = body.name || null;

    // Generate new API key
    const { key, hash, prefix } = generateApiKey();

    // Save to database
    const [newKey] = await ctx.db
      .insert(apiKeys)
      .values({
        userId: session.user.id,
        name,
        keyHash: hash,
        keyPrefix: prefix,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
      });

    // Return the full key only on creation (won't be shown again)
    return jsonResponse({
      ...newKey,
      key, // Full key - only returned once!
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return errorResponse("Failed to create API key", 500);
  }
}
