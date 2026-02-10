import { AuthProvider } from "@/components/auth/provider";
import { OverlayProvider } from "@/components/overlays/overlay-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PersistentCanvas } from "@/components/workflow/persistent-canvas";
import { ReactFlowProvider } from "@xyflow/react";
import { Provider } from "jotai";
import * as React from "react";

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
          </OverlayProvider>
        </AuthProvider>
      </Provider>
    </ThemeProvider>
  );
};

export { LayoutProvider };
