import { and, eq } from "drizzle-orm";
import { isAiGatewayManagedKeysEnabled } from "../../../../../lib/ai-gateway/config.js";
import { accounts, integrations } from "../../../../db/schema.js";
import { jsonResponse, requireSession } from "../../../handler-utils.js";
import type { RouteHandler } from "../../../types.js";

export const aiGatewayStatus: RouteHandler = async (route, ctx) => {
  const enabled = isAiGatewayManagedKeysEnabled();

  // If feature is not enabled, return minimal response
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

  // Check if user signed in with Vercel
  const account = await ctx.db.query.account.findFirst({
    where: eq(accounts.userId, session.user.id),
  });

  const isVercelUser = account?.providerId === "vercel";

  // Check if user has a managed AI Gateway integration
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
