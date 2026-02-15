import { and, eq } from "drizzle-orm";
import { isAiGatewayManagedKeysEnabled } from "../../../../../lib/ai-gateway/config.js";
import { decrypt, encrypt } from "../../../../../lib/db/integrations.js";
import { generateId } from "../../../../../lib/utils/id.js";
import { accounts, integrations } from "../../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../../types.js";

const API_KEY_PURPOSE = "ai-gateway";
const API_KEY_NAME = "Workflow Builder Gateway Key";

/**
 * Get team ID from Vercel API
 * First tries /v2/teams, then falls back to userinfo endpoint
 */
async function getTeamId(accessToken: string): Promise<string | null> {
  // First, try to get teams the user has granted access to
  const teamsResponse = await fetch("https://api.vercel.com/v2/teams", {
    headers: { Authorization: `Bearer ${ accessToken }` },
  });

  if (teamsResponse.ok) {
    const teamsData = await teamsResponse.json();
    // biome-ignore lint/suspicious/noExplicitAny: API response type
    const accessibleTeam = teamsData.teams?.find((t: any) => !t.limited);
    if (accessibleTeam) {
      return accessibleTeam.id;
    }
  }

  // Fallback: get user ID from userinfo endpoint
  const userinfoResponse = await fetch(
    "https://api.vercel.com/login/oauth/userinfo",
    { headers: { Authorization: `Bearer ${ accessToken }` } },
  );

  if (!userinfoResponse.ok) {
    return null;
  }

  const userinfo = await userinfoResponse.json();
  return userinfo.sub;
}

/**
 * Create or exchange API key on Vercel
 */
async function createVercelApiKey(
  accessToken: string,
  teamId: string,
): Promise<{ token: string; id: string } | null> {
  const response = await fetch(
    `https://api.vercel.com/v1/api-keys?teamId=${ teamId }`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ accessToken }`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        purpose: API_KEY_PURPOSE,
        name: API_KEY_NAME,
        exchange: true,
      }),
    },
  );

  if (!response.ok) {
    console.error(
      "[ai-gateway] Failed to create API key:",
      await response.text(),
    );
    return null;
  }

  const newKey = await response.json();
  if (!newKey.apiKeyString) {
    return null;
  }

  return { token: newKey.apiKeyString, id: newKey.apiKey?.id };
}

type SaveIntegrationParams = {
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle db type varies
  db: any;
  userId: string;
  apiKey: string;
  apiKeyId: string;
  teamId: string;
  teamName: string;
};

/**
 * Save managed integration in database
 */
async function saveIntegration(params: SaveIntegrationParams): Promise<string> {
  const { db, userId, apiKey, apiKeyId, teamId, teamName } = params;

  const configData = { apiKey, managedKeyId: apiKeyId, teamId };
  const encryptedConfig = encrypt(JSON.stringify(configData));

  const integrationId = generateId();
  await db.insert(integrations).values({
    id: integrationId,
    userId,
    name: teamName,
    type: "ai-gateway",
    config: encryptedConfig,
    isManaged: true,
  });
  return integrationId;
}

/**
 * Delete API key from Vercel
 */
async function deleteVercelApiKey(
  accessToken: string,
  apiKeyId: string,
  teamId: string,
): Promise<void> {
  await fetch(
    `https://api.vercel.com/v1/api-keys/${ apiKeyId }?teamId=${ teamId }`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ accessToken }` },
    },
  );
}

export const aiGatewayConsent: RouteHandler = async (route, ctx) => {
  switch (route.method) {
    case "POST":
      return handleConsent(route, ctx);
    case "DELETE":
      return revokeConsent(route, ctx);
    default:
      return errorResponse("Method not allowed", 405);
  }
};

async function handleConsent(
  route: { request: Request },
  ctx: HandlerContext,
) {
  if (!isAiGatewayManagedKeysEnabled()) {
    return errorResponse("Feature not enabled", 403);
  }

  const session = await requireSession(ctx, route.request);
  if (!session) {
    return errorResponse("Not authenticated", 401);
  }

  const account = await ctx.db.query.account.findFirst({
    where: eq(accounts.userId, session.user.id),
  });

  if (!account?.accessToken || account.providerId !== "vercel") {
    return errorResponse("No Vercel account linked", 400);
  }

  // Get teamId and teamName from request body
  let teamId: string | null = null;
  let teamName: string | null = null;
  try {
    const body = await route.request.json();
    teamId = body.teamId;
    teamName = body.teamName;
  } catch {
    // If no body, try to auto-detect
  }

  // If no teamId provided, try to auto-detect
  if (!teamId) {
    teamId = await getTeamId(account.accessToken);
  }

  if (!teamId) {
    return errorResponse("Could not determine user's team", 500);
  }

  try {
    const vercelApiKey = await createVercelApiKey(account.accessToken, teamId);
    if (!vercelApiKey) {
      return errorResponse("Failed to create API key", 500);
    }

    const integrationId = await saveIntegration({
      db: ctx.db,
      userId: session.user.id,
      apiKey: vercelApiKey.token,
      apiKeyId: vercelApiKey.id,
      teamId,
      teamName: teamName || "AI Gateway",
    });

    return jsonResponse({
      success: true,
      hasManagedKey: true,
      managedIntegrationId: integrationId,
    });
  } catch (e) {
    console.error("[ai-gateway] Error creating API key:", e);
    return errorResponse("Failed to create API key", 500);
  }
}

async function revokeConsent(
  route: { request: Request },
  ctx: HandlerContext,
) {
  if (!isAiGatewayManagedKeysEnabled()) {
    return errorResponse("Feature not enabled", 403);
  }

  const session = await requireSession(ctx, route.request);
  if (!session) {
    return errorResponse("Not authenticated", 401);
  }

  const { searchParams } = new URL(route.request.url);
  const integrationId = searchParams.get("integrationId");

  if (!integrationId) {
    return errorResponse("integrationId query parameter is required", 400);
  }

  const managedIntegration = await ctx.db.query.integrations.findFirst({
    where: and(
      eq(integrations.id, integrationId),
      eq(integrations.userId, session.user.id),
      eq(integrations.type, "ai-gateway"),
      eq(integrations.isManaged, true),
    ),
  });

  if (!managedIntegration) {
    return errorResponse("Integration not found", 404);
  }

  // Get managedKeyId and teamId from config (decrypt it first)
  let config: { managedKeyId?: string; teamId?: string } | null = null;
  if (managedIntegration?.config) {
    try {
      const decrypted = decrypt(managedIntegration.config as string);
      config = JSON.parse(decrypted);
    } catch (e) {
      console.error("[ai-gateway] Failed to decrypt config:", e);
    }
  }

  if (config?.managedKeyId && config?.teamId) {
    const account = await ctx.db.query.account.findFirst({
      where: eq(accounts.userId, session.user.id),
    });

    if (account?.accessToken) {
      try {
        await deleteVercelApiKey(
          account.accessToken,
          config.managedKeyId,
          config.teamId,
        );
      } catch (e) {
        console.error("[ai-gateway] Failed to delete API key from Vercel:", e);
      }
    }
  }

  await ctx.db
    .delete(integrations)
    .where(eq(integrations.id, managedIntegration.id));

  return jsonResponse({ success: true, hasManagedKey: false });
}
