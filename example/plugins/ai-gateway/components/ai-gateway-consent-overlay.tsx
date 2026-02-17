"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import {
  managedConnectionStatusAtom,
  managedConnectionTeamsAtom,
  managedConnectionTeamsLoadingAtom,
  type ConsentOverlayProps,
} from "next-workflow-builder/plugins";
import { aiGatewayApi } from "../lib/api-client";

// Import UI components from the package
import { Overlay } from "next-workflow-builder/components/overlays/overlay";
import { useOverlay } from "next-workflow-builder/components/overlays/overlay-provider";
import type { OverlayAction } from "next-workflow-builder/components/overlays/types";

export function AiGatewayConsentOverlay({
  overlayId,
  onConsent,
  onManualEntry,
  onDecline,
}: ConsentOverlayProps) {
  const { pop } = useOverlay();
  const setStatus = useSetAtom(managedConnectionStatusAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const teams = useAtomValue(managedConnectionTeamsAtom);
  const teamsLoading = useAtomValue(managedConnectionTeamsLoadingAtom);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const completeConsent = useCallback(
    (integrationId: string) => {
      setLoading(false);
      onConsent?.(integrationId);
      pop();
    },
    [onConsent, pop]
  );

  const handleConsent = useCallback(async () => {
    if (!selectedTeamId) {
      setError("Please select a team");
      return;
    }

    const selectedTeam = teams.find((t) => t.id === selectedTeamId);
    const teamName = selectedTeam?.name || "AI Gateway";

    setLoading(true);
    setError(null);

    try {
      const result = await aiGatewayApi.consent(selectedTeamId, teamName);

      if (!result.success) {
        throw new Error(result.error || "Failed to set up AI Gateway");
      }

      const integrationId = result.managedIntegrationId || "";

      setStatus((prev) =>
        prev
          ? {
              ...prev,
              hasManagedKey: result.hasManagedKey,
              managedIntegrationId: integrationId,
            }
          : null
      );

      completeConsent(integrationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setLoading(false);
    }
  }, [selectedTeamId, teams, setStatus, completeConsent]);

  const handleDecline = useCallback(() => {
    onDecline?.();
    pop();
  }, [onDecline, pop]);

  const handleManualEntry = useCallback(() => {
    onManualEntry?.();
  }, [onManualEntry]);

  const actions: OverlayAction[] = [
    ...(onManualEntry
      ? [
          {
            label: "Enter manually",
            variant: "ghost" as const,
            onClick: handleManualEntry,
            disabled: loading,
          },
        ]
      : []),
    {
      label: "Cancel",
      variant: "outline" as const,
      onClick: handleDecline,
      disabled: loading,
    },
    {
      label: loading ? "Setting up..." : "Agree & Connect",
      variant: "default" as const,
      onClick: handleConsent,
      disabled:
        loading || (teamsLoading && teams.length === 0) || !selectedTeamId,
      loading,
    },
  ];

  return (
    <Overlay
      actions={actions}
      description="Connect your Vercel account to use your own AI Gateway balance"
      overlayId={overlayId}
      title="Use Your AI Gateway Credits"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <svg className="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <p className="pt-2 text-muted-foreground text-sm">
            This will create an API key on your Vercel account that uses your AI
            Gateway credits for AI operations in workflows.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="team-select">
            Vercel Team
          </label>
          {teamsLoading && teams.length === 0 ? (
            <div className="flex h-10 items-center gap-2 rounded-md border px-3 text-muted-foreground text-sm">
              <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading teams...
            </div>
          ) : (
            <select
              id="team-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              value={selectedTeamId}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}{team.isPersonal ? " (Personal)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-md border border-red-500/30 bg-red-500/10 p-3">
            <svg className="mt-0.5 size-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-red-700 text-sm dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </Overlay>
  );
}
