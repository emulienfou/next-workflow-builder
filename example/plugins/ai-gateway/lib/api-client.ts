"use client";

import { apiCall } from "next-workflow-builder/lib/api-client";
import type {
  ManagedConnectionStatus,
  ManagedConnectionTeam,
  ManagedConsentResponse,
  ManagedConnectionApi,
} from "next-workflow-builder/plugins";

type AiGatewayTeamsResponse = {
  teams: ManagedConnectionTeam[];
};

/**
 * AI Gateway API client for managed connection operations
 */
export const aiGatewayApi: ManagedConnectionApi = {
  getStatus: () =>
    apiCall<NonNullable<ManagedConnectionStatus>>("/api/ai-gateway/status"),

  getTeams: () =>
    apiCall<AiGatewayTeamsResponse>("/api/ai-gateway/teams"),

  consent: (teamId: string, teamName: string) =>
    apiCall<ManagedConsentResponse>("/api/ai-gateway/consent", {
      method: "POST",
      body: JSON.stringify({ teamId, teamName }),
    }),

  revokeConsent: () =>
    apiCall<ManagedConsentResponse>("/api/ai-gateway/consent", {
      method: "DELETE",
    }),
};
