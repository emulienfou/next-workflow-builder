"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";

import { authClient } from "../../lib/auth-client";

const AuthProvider = (props: PropsWithChildren) => {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={ authClient }
      navigate={ router.push }
      replace={ router.replace }
      onSessionChange={ () => {
        // Clear router cache (protected routes)
        router.refresh();
      } }
      Link={ Link }
    >
      { props.children }
    </AuthUIProvider>
  );
};

export { AuthProvider };
