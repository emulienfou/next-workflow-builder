import type { NextConfig } from "next";
import nextWorkflowBuilder from "next-workflow-builder";

const withNextWorkflowBuilder = nextWorkflowBuilder({
  // NextWorkflowBuilder-specific options
  authOptions: {
    socialProviders: {
      vercel: {
        clientId: process.env.VERCEL_CLIENT_ID as string,
        clientSecret: process.env.VERCEL_CLIENT_SECRET as string,
      },
    },
  },
});

export default withNextWorkflowBuilder({
  // Regular Next.js options
} satisfies NextConfig);
