import { createWorkflowApiHandler } from "next-workflow-builder";

// Create the handler once — database URL is read from NEXT_WORKFLOW_BUILDER_DATABASE_URL env var
const handler = createWorkflowApiHandler({
  authOptions: {
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      vercel: {
        clientId: process.env.VERCEL_CLIENT_ID || "",
        clientSecret: process.env.VERCEL_CLIENT_SECRET || "",
        scope: ["openid", "email", "profile"],
      },
    },
  },
});

// Export the methods you strictly need (OPTIONS is usually auto-handled)
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
