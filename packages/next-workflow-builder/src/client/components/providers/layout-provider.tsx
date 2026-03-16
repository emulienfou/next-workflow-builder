"use client";

import type { AuthUIProviderProps } from "@daveyplate/better-auth-ui";
import { ReactFlowProvider } from "@xyflow/react";
import { Provider as JotaiProvider, useSetAtom } from "jotai";
import * as React from "react";
import { canvasOptionsAtom, type CanvasOptions } from "../../lib/workflow-store";
import { useManagedConnectionSetup } from "../../lib/managed-connection";
import { GlobalModals } from "../global-modals";
import { OverlayProvider } from "../overlays/overlay-provider";
import { Toaster } from "../ui/sonner";
import { PersistentCanvas } from "../workflow/persistent-canvas";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";

/** Inner component that runs hooks inside the Jotai Provider context */
function LayoutInner(props: React.PropsWithChildren<{ canvas?: CanvasOptions }>) {
  useManagedConnectionSetup();

  const setCanvasOptions = useSetAtom(canvasOptionsAtom);
  React.useEffect(() => {
    if (props.canvas) {
      setCanvasOptions((prev) => ({ ...prev, ...props.canvas }));
    }
  }, [props.canvas, setCanvasOptions]);

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

const LayoutProvider = (props: Omit<AuthUIProviderProps, "authClient"> & { canvas?: CanvasOptions }) => {
  const { children, canvas, ...restAuth } = props;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <AuthProvider { ...restAuth }>
        <JotaiProvider>
          <LayoutInner canvas={canvas}>{ children }</LayoutInner>
        </JotaiProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export { LayoutProvider };
