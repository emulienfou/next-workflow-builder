"use client";

import { atom, type PrimitiveAtom, useSetAtom } from "jotai";
import type { ComponentType } from "react";
import { useEffect } from "react";

/**
 * Managed Connection Provider
 *
 * A pluggable system for plugins that manage API key creation on behalf of users
 * (e.g., AI Gateway creating Vercel API keys via OAuth consent).
 *
 * Plugins call `registerManagedConnectionProvider()` at module load time (side effect).
 * The LayoutProvider calls `useManagedConnectionSetup()` to hydrate the Jotai atom
 * within the correct Provider context.
 *
 * Core components check `managedConnectionProviderAtom` to conditionally render
 * managed connection UI. If no plugin registers, the UI simply doesn't appear.
 */

/** Status of the managed connection feature */
export type ManagedConnectionStatus = {
  enabled: boolean;
  signedIn: boolean;
  isVercelUser: boolean;
  hasManagedKey: boolean;
  managedIntegrationId?: string;
} | null;

/** Team info for team selection in consent flow */
export type ManagedConnectionTeam = {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  isPersonal: boolean;
};

/** Response from consent/revoke operations */
export type ManagedConsentResponse = {
  success: boolean;
  hasManagedKey: boolean;
  managedIntegrationId?: string;
  error?: string;
};

/** Props for the consent overlay component */
export type ConsentOverlayProps = {
  overlayId: string;
  onConsent?: (integrationId: string) => void;
  onManualEntry?: () => void;
  onDecline?: () => void;
};

/** API methods the managed connection plugin must provide */
export type ManagedConnectionApi = {
  getStatus: () => Promise<NonNullable<ManagedConnectionStatus>>;
  getTeams: () => Promise<{ teams: ManagedConnectionTeam[] }>;
  consent: (teamId: string, teamName: string) => Promise<ManagedConsentResponse>;
  revokeConsent: () => Promise<ManagedConsentResponse>;
};

/** Full provider registered by a plugin */
export type ManagedConnectionProvider = {
  /** Which integration type this provider handles */
  integrationType: string;
  /** The consent overlay component to render */
  ConsentOverlay: ComponentType<ConsentOverlayProps>;
  /** API methods for status, teams, consent, revoke */
  api: ManagedConnectionApi;
};

// --- Pending registration (set at module load, hydrated into Jotai on mount) ---

let pendingProvider: ManagedConnectionProvider | null = null;

/**
 * Register a managed connection provider.
 * Called at module load time by plugin side-effect imports.
 */
export function registerManagedConnectionProvider(provider: ManagedConnectionProvider) {
  pendingProvider = provider;
}

// --- Atoms ---

/** Managed connection status (populated by plugin) */
export const managedConnectionStatusAtom = atom<ManagedConnectionStatus>(null) as PrimitiveAtom<ManagedConnectionStatus>;

/** Teams list */
export const managedConnectionTeamsAtom: PrimitiveAtom<ManagedConnectionTeam[]> = atom<ManagedConnectionTeam[]>([]);

/** Loading states */
export const managedConnectionTeamsLoadingAtom: PrimitiveAtom<boolean> = atom(false);

/** Whether teams have been fetched at least once */
export const managedConnectionTeamsFetchedAtom: PrimitiveAtom<boolean> = atom(false);

/** The registered provider — null if no plugin provides managed connections */
export const managedConnectionProviderAtom = atom<ManagedConnectionProvider | null>(null) as PrimitiveAtom<ManagedConnectionProvider | null>;

// --- Setup hook ---

/**
 * Hook to hydrate the managed connection provider atom from pending registration.
 * Called in the LayoutProvider after the Jotai Provider is mounted.
 */
export function useManagedConnectionSetup() {
  const setProvider = useSetAtom(managedConnectionProviderAtom);

  useEffect(() => {
    if (pendingProvider) {
      setProvider(pendingProvider);
    }
  }, [setProvider]);
}
