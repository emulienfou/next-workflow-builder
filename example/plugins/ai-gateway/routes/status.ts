import { isAiGatewayManagedKeysEnabled } from "../lib/config";
import type { RouteHandler } from "next-workflow-builder";
import { and, eq, jsonResponse, requireSession, schema } from "next-workflow-builder";

const { accounts, integrations } = schema;

export const aiGatewayStatus: RouteHandler = async (route, ctx) => {
  const enabled = isAiGatewayManagedKeysEnabled();

  if (!enabled) {
    return jsonResponse({
      enabled: false,
      signedIn: false,
      isVercelUser: false,
      hasManagedKey: false,
    });
  }

  const session = await requireSession(ctx, route.request);

  if (!session) {
    return jsonResponse({
      enabled: true,
      signedIn: false,
      isVercelUser: false,
      hasManagedKey: false,
    });
  }

  const account = await ctx.db.query.account.findFirst({
    where: eq(accounts.userId, session.user.id),
  });

  const isVercelUser = account?.providerId === "vercel";

  const managedIntegration = await ctx.db.query.integrations.findFirst({
    where: and(
      eq(integrations.userId, session.user.id),
      eq(integrations.type, "ai-gateway"),
      eq(integrations.isManaged, true),
    ),
  });

  return jsonResponse({
    enabled: true,
    signedIn: true,
    isVercelUser,
    hasManagedKey: !!managedIntegration,
    managedIntegrationId: managedIntegration?.id,
  });
};
