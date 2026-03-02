"use client";
// Side-effect import: triggers consumer's plugin registration on the client.
// Resolved to the consumer's plugins/index.ts via webpack/turbopack alias
// set up by the Next.js config wrapper.
import "virtual:workflow-builder-plugins";
import type { AuthUIProviderProps } from "@daveyplate/better-auth-ui";
import * as React from "react";
import { LayoutProvider } from "./providers/layout-provider";

const Layout = (props: Omit<AuthUIProviderProps, "authClient">) => {
  const { children, ...rest } = props;

  return <LayoutProvider { ...rest }>{ children }</LayoutProvider>;
};

export { Layout };
