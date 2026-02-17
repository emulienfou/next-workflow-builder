import { isAiGatewayManagedKeysEnabled } from "../lib/config";
import type { RouteHandler } from "next-workflow-builder";
import { eq, errorResponse, jsonResponse, requireSession, schema } from "next-workflow-builder";

const { accounts } = schema;

type VercelTeam = {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  isPersonal: boolean;
};

type VercelTeamApiResponse = {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  limited?: boolean;
};

type VercelUserResponse = {
  defaultTeamId: string | null;
};

async function fetchDefaultTeamId(accessToken: string): Promise<string | null> {
  const response = await fetch("https://api.vercel.com/v2/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { user?: VercelUserResponse };
  return data.user?.defaultTeamId ?? null;
}

async function fetchTeams(accessToken: string): Promise<VercelTeam[]> {
  const response = await fetch("https://api.vercel.com/v2/teams", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { teams?: VercelTeamApiResponse[] };
  const teams: VercelTeam[] = [];

  for (const team of data.teams || []) {
    if (team.limited) continue;
    teams.push({
      id: team.id,
      name: team.name,
      slug: team.slug,
      avatar: `https://vercel.com/api/www/avatar?teamId=${team.id}&s=64`,
      isPersonal: false,
    });
  }

  return teams;
}

export const aiGatewayTeams: RouteHandler = async (route, ctx) => {
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

  try {
    const [defaultTeamId, teams] = await Promise.all([
      fetchDefaultTeamId(account.accessToken),
      fetchTeams(account.accessToken),
    ]);

    const teamsWithPersonal = teams.map((team) => ({
      ...team,
      isPersonal: team.id === defaultTeamId,
    }));

    const sortedTeams = teamsWithPersonal.sort((a, b) => {
      if (a.isPersonal) return -1;
      if (b.isPersonal) return 1;
      return a.name.localeCompare(b.name);
    });

    return jsonResponse({ teams: sortedTeams });
  } catch (e) {
    console.error("[ai-gateway] Error fetching teams:", e);
    return errorResponse("Failed to fetch teams", 500);
  }
};
