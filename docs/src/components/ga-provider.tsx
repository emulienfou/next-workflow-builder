"use client";

import * as React from "react";

import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * GAProvider is a React functional component designed to conditionally include
 * Google Analytics tracking in a Next.js application. It wraps the provided
 * children components and only renders the `GoogleAnalytics` component if a
 * valid Google Analytics ID is present in the environment variables.
 *
 * Environment Variable:
 * - NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: The Google Analytics tracking ID. The
 *   component includes the analytics script if this variable is defined.
 *
 * If the environment variable is not set, the component renders its children
 * without including the Google Analytics functionality.
 */
const GAProvider = (props: React.PropsWithChildren) => {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  if (!id) return <React.Fragment>{props.children}</React.Fragment>;

  return (
    <React.Fragment>
      {props.children}
      <GoogleAnalytics gaId={id} />
    </React.Fragment>
  );
};

export default GAProvider;
