"use client";
import * as React from "react";
import { LayoutProvider } from "./providers/layout-provider";

const Layout = (props: React.PropsWithChildren) => (
  <LayoutProvider>
    { props.children }
  </LayoutProvider>
);

export { Layout };
