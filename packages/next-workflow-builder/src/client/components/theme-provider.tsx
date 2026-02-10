"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

const ThemeProvider = ({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) =>
  <NextThemesProvider { ...props }>{ children }</NextThemesProvider>;

export { ThemeProvider };
