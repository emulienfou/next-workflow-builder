"use client";
// Side-effect import: triggers consumer's plugin registration on the client.
// Resolved to the consumer's plugins/index.ts via webpack/turbopack alias
// set up by the Next.js config wrapper.
import "virtual:workflow-builder-plugins";
import type { AuthUIProviderProps } from "@daveyplate/better-auth-ui";
import * as React from "react";
import type { CanvasOptions } from "../lib/workflow-store";
import { LayoutProvider } from "./providers/layout-provider";

export type LayoutProps = Omit<AuthUIProviderProps, "authClient"> & {
  /** Canvas configuration options */
  canvas?: CanvasOptions;
};

const Layout = (props: LayoutProps) => {
  const { children, canvas, ...rest } = props;

  return <LayoutProvider canvas={canvas} { ...rest }>{ children }</LayoutProvider>;
};

export { Layout };
