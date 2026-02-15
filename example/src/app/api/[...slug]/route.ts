import { createWorkflowApiHandler } from "next-workflow-builder";

// Create the handler once
const handler = createWorkflowApiHandler({
  databaseUrl: process.env.DATABASE_URL || "postgres://localhost:5432/workflow",
});

// Export the methods you strictly need (OPTIONS is usually auto-handled)
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
