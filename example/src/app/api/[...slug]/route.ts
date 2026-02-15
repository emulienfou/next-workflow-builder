import { db } from "@/lib/db";
import { createWorkflowApiHandler } from "next-workflow-builder";

// Create the handler once
const handler = createWorkflowApiHandler({ db });

// Export the methods you strictly need (OPTIONS is usually auto-handled)
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
