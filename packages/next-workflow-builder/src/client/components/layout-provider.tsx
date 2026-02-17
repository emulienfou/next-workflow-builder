"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Provider } from "jotai";
import * as React from "react";
import { useManagedConnectionSetup } from "../../lib/managed-connection";
import { GlobalModals } from "./global-modals";
import { OverlayProvider } from "./overlays/overlay-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { PersistentCanvas } from "./workflow/persistent-canvas";

/** Inner component that runs hooks inside the Jotai Provider context */
function LayoutInner({ children }: React.PropsWithChildren) {
  useManagedConnectionSetup();
  return (
    <OverlayProvider>
      <React.Suspense>
        <ReactFlowProvider>
          <PersistentCanvas/>
          <div className="pointer-events-none relative z-10">{ children }</div>
        </ReactFlowProvider>
      </React.Suspense>
      <Toaster/>
      <GlobalModals/>
    </OverlayProvider>
  );
}

const LayoutProvider = (props: React.PropsWithChildren) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <Provider>
        <LayoutInner>{ props.children }</LayoutInner>
      </Provider>
    </ThemeProvider>
  );
};

export { LayoutProvider };
