"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Provider } from "jotai";
import * as React from "react";
import { AuthProvider } from "./auth/provider";
import { GlobalModals } from "./global-modals";
import { OverlayProvider } from "./overlays/overlay-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { PersistentCanvas } from "./workflow/persistent-canvas";

const LayoutProvider = (props: React.PropsWithChildren) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <Provider>
        <AuthProvider>
          <OverlayProvider>
            <React.Suspense>
              <ReactFlowProvider>
                <PersistentCanvas/>
                <div className="pointer-events-none relative z-10">{ props.children }</div>
              </ReactFlowProvider>
            </React.Suspense>
            <Toaster />
            <GlobalModals />
          </OverlayProvider>
        </AuthProvider>
      </Provider>
    </ThemeProvider>
  );
};

export { LayoutProvider };
