import { createWorkflowApiHandler } from "next-workflow-builder";

// Create the handler once — database URL is read from NEXT_WORKFLOW_BUILDER_DATABASE_URL env var
const handler = createWorkflowApiHandler({});

// Export the methods you strictly need (OPTIONS is usually auto-handled)
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
