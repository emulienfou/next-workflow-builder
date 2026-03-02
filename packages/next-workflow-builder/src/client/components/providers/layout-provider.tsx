"use client";

import type { AuthUIProviderProps } from "@daveyplate/better-auth-ui";
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
          { props.children }
        </ReactFlowProvider>
      </React.Suspense>
      <Toaster/>
      <GlobalModals/>
    </OverlayProvider>
  );
}

const LayoutProvider = (props: Omit<AuthUIProviderProps, "authClient">) => {
  const { children, ...restAuth } = props;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <AuthProvider { ...restAuth }>
        <JotaiProvider>
          <LayoutInner>{ children }</LayoutInner>
        </JotaiProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export { LayoutProvider };
