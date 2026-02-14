import { and, eq } from "drizzle-orm";
import { encrypt } from "../../../../lib/db/integrations.js";
import type { IntegrationConfig, IntegrationType } from "../../../../lib/types/integration.js";
import { integrations } from "../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../handler-utils.js";
import type { HandlerContext, RouteHandler } from "../../types.js";

export type GetIntegrationsResponse = {
  id: string;
  name: string;
  type: IntegrationType;
  isManaged?: boolean;
  createdAt: string;
  updatedAt: string;
}[];

export type CreateIntegrationRequest = {
  name?: string;
  type: IntegrationType;
  config: IntegrationConfig;
};

export type CreateIntegrationResponse = {
  id: string;
  name: string;
  type: IntegrationType;
  createdAt: string;
  updatedAt: string;
};

export const integrationsHandler: RouteHandler = async (route, ctx) => {
  switch (route.method) {
    case "GET":
      return listIntegrations(route, ctx);
    case "POST":
      return createIntegration(route, ctx);
    default:
      return errorResponse("Method not allowed", 405);
  }
};

async function listIntegrations(
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Get optional type filter from query params
    const { searchParams } = new URL(route.request.url);
    const typeFilter = searchParams.get("type") as IntegrationType | null;

    const conditions = [eq(integrations.userId, session.user.id)];
    if (typeFilter) {
      conditions.push(eq(integrations.type, typeFilter));
    }

    const results = await ctx.db
      .select()
      .from(integrations)
      .where(and(...conditions));

    // Return integrations without config for security
    const response: GetIntegrationsResponse = results.map(
      (integration: {
        id: string;
        name: string;
        type: IntegrationType;
        isManaged: boolean | null;
        createdAt: Date;
        updatedAt: Date
      }) => ({
        id: integration.id,
        name: integration.name,
        type: integration.type,
        isManaged: integration.isManaged ?? false,
        createdAt: integration.createdAt.toISOString(),
        updatedAt: integration.updatedAt.toISOString(),
      }),
    );

    return jsonResponse(response);
  } catch (error) {
    console.error("Failed to get integrations:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to get integrations",
      500,
    );
  }
}

async function createIntegration(
  route: { request: Request },
  ctx: HandlerContext,
) {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const body: CreateIntegrationRequest = await route.request.json();

    if (!(body.type && body.config)) {
      return errorResponse("Type and config are required", 400);
    }

    const encryptedConfig = encrypt(JSON.stringify(body.config));

    const [result] = await ctx.db
      .insert(integrations)
      .values({
        userId: session.user.id,
        name: body.name || "",
        type: body.type,
        config: encryptedConfig,
      })
      .returning();

    const response: CreateIntegrationResponse = {
      id: result.id,
      name: result.name,
      type: result.type,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Failed to create integration:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create integration",
      500,
    );
  }
}
