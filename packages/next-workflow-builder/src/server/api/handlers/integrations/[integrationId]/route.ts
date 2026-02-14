import { and, eq } from "drizzle-orm";
import { decrypt, encrypt } from "../../../../../lib/db/integrations.js";
import type { IntegrationConfig } from "../../../../../lib/types/integration.js";
import { integrations, type NewIntegration } from "../../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../../types.js";

export type GetIntegrationResponse = {
  id: string;
  name: string;
  type: string;
  config: IntegrationConfig;
  createdAt: string;
  updatedAt: string;
};

export type UpdateIntegrationRequest = {
  name?: string;
  config?: IntegrationConfig;
};

function decryptConfig(encryptedConfig: string): IntegrationConfig {
  try {
    const decrypted = decrypt(encryptedConfig);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Failed to decrypt integration config:", error);
    return {};
  }
}

export const integrationHandler: RouteHandler = async (route, ctx) => {
  const integrationId = route.segments[1];

  switch (route.method) {
    case "GET":
      return getIntegration(integrationId, route, ctx);
    case "PUT":
      return updateIntegration(integrationId, route, ctx);
    case "DELETE":
      return deleteIntegration(integrationId, route, ctx);
    default:
      return errorResponse("Method not allowed", 405);
  }
};

async function getIntegration(
  integrationId: string,
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const results = await ctx.db
      .select()
      .from(integrations)
      .where(
        and(eq(integrations.id, integrationId), eq(integrations.userId, session.user.id)),
      )
      .limit(1);

    if (results.length === 0) {
      return errorResponse("Integration not found", 404);
    }

    const integration = results[0];

    const response: GetIntegrationResponse = {
      id: integration.id,
      name: integration.name,
      type: integration.type,
      config: decryptConfig(integration.config as string),
      createdAt: integration.createdAt.toISOString(),
      updatedAt: integration.updatedAt.toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Failed to get integration:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to get integration",
      500,
    );
  }
}

async function updateIntegration(
  integrationId: string,
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const body: UpdateIntegrationRequest = await route.request.json();

    const updateData: Partial<NewIntegration> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.config !== undefined) {
      updateData.config = encrypt(JSON.stringify(body.config));
    }

    const [result] = await ctx.db
      .update(integrations)
      .set(updateData)
      .where(
        and(eq(integrations.id, integrationId), eq(integrations.userId, session.user.id)),
      )
      .returning();

    if (!result) {
      return errorResponse("Integration not found", 404);
    }

    const response: GetIntegrationResponse = {
      id: result.id,
      name: result.name,
      type: result.type,
      config: decryptConfig(result.config as string),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Failed to update integration:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update integration",
      500,
    );
  }
}

async function deleteIntegration(
  integrationId: string,
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const result = await ctx.db
      .delete(integrations)
      .where(
        and(eq(integrations.id, integrationId), eq(integrations.userId, session.user.id)),
      )
      .returning();

    if (result.length === 0) {
      return errorResponse("Integration not found", 404);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete integration:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete integration",
      500,
    );
  }
}
