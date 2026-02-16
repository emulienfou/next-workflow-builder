"use client";


import { OverlayContainer } from "./overlays/overlay-container";
import { OverlaySync } from "./overlays/overlay-sync";

/**
 * Global modals and overlays that need to be rendered once at app level
 */
export function GlobalModals() {
  return (
    <>
      <OverlayContainer/>
      <OverlaySync/>
    </>
  );
}
