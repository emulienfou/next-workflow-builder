import "server-only";
import type { RouteHandler } from "next-workflow-builder";
import { eq, errorResponse, jsonResponse, requireSession, schema, decrypt } from "next-workflow-builder";

const { integrations } = schema;

const SLACK_API_URL = "https://slack.com/api";

type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

type SlackConversation = {
  id: string;
  name: string;
  is_private: boolean;
};

type SlackConversationsListResponse = {
  ok: boolean;
  channels?: SlackConversation[];
  error?: string;
};

export const slackChannels: RouteHandler = async (route, ctx) => {
  const session = await requireSession(ctx, route.request);
  if (!session) {
    return errorResponse("Not authenticated", 401);
  }

  const integration = await ctx.db.query.integrations.findFirst({
    where: eq(integrations.userId, session.user.id),
  });

  if (!integration || integration.type !== "slack") {
    return errorResponse("No Slack integration found", 400);
  }

  let apiKey: string | undefined;

  try {
    const decrypted = decrypt(integration.config as string);
    const config = JSON.parse(decrypted) as Record<string, string>;
    apiKey = config.apiKey || config.SLACK_API_KEY;
  } catch {
    return errorResponse("Failed to decrypt Slack credentials", 500);
  }

  if (!apiKey) {
    return errorResponse("Slack API key not configured", 400);
  }

  try {
    const response = await fetch(`${SLACK_API_URL}/conversations.list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return errorResponse(`Slack API error: HTTP ${response.status}`, 502);
    }

    const data = (await response.json()) as SlackConversationsListResponse;

    if (!data.ok) {
      return errorResponse(data.error || "Failed to fetch channels", 502);
    }

    const channels: SlackChannel[] = (data.channels || []).map((ch) => ({
      id: ch.id,
      name: ch.name,
      isPrivate: ch.is_private,
    }));

    return jsonResponse({ channels });
  } catch (e) {
    console.error("[slack] Error fetching channels:", e);
    return errorResponse("Failed to fetch Slack channels", 500);
  }
};
