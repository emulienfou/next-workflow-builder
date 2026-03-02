"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Provider as JotaiProvider } from "jotai";
import * as React from "react";
import { useManagedConnectionSetup } from "../../lib/managed-connection";
import { GlobalModals } from "../global-modals";
import { OverlayProvider } from "../overlays/overlay-provider";
import { Toaster } from "../ui/sonner";
import { PersistentCanvas } from "../workflow/persistent-canvas";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";

/** Inner component that runs hooks inside the Jotai Provider context */
function LayoutInner(props: React.PropsWithChildren) {
  useManagedConnectionSetup();

  return (
    <OverlayProvider>
      <React.Suspense>
        <ReactFlowProvider>
          <PersistentCanvas/>
          <div className="pointer-events-none relative z-10">{ props.children }</div>
        </ReactFlowProvider>
      </React.Suspense>
      <Toaster/>
      <GlobalModals/>
    </OverlayProvider>
  );
}

const LayoutProvider = (props: React.PropsWithChildren) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    enableSystem
  >
    <AuthProvider>
      <JotaiProvider>
        <LayoutInner>{ props.children }</LayoutInner>
      </JotaiProvider>
    </AuthProvider>
  </ThemeProvider>
);

export { LayoutProvider };
