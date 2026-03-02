"use client";

import { AuthUIProvider, type AuthUIProviderProps } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { authClient } from "../../lib/auth-client";

const AuthProvider = (props: Omit<AuthUIProviderProps, "authClient">) => {
  const router = useRouter();
  const { children, ...rest } = props;

  return (
    <AuthUIProvider
      { ...rest }
      authClient={ authClient }
      navigate={ router.push }
      replace={ router.replace }
      onSessionChange={ () => {
        // Clear router cache (protected routes)
        router.refresh();
      } }
      Link={ Link }
    >
      { children }
    </AuthUIProvider>
  );
};

export { AuthProvider };
