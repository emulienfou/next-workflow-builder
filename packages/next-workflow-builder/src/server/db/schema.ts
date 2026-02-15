import {
  accounts,
  apiKeys,
  integrations,
  sessions,
  users,
  verifications,
  workflowExecutionLogs,
  workflowExecutions,
  workflowExecutionsRelations,
  workflows,
} from "./schema.js";

export {
  users,
  sessions,
  accounts,
  verifications,
  workflows,
  integrations,
  workflowExecutions,
  workflowExecutionLogs,
  workflowExecutionsRelations,
  apiKeys,
} from '../../lib/db/schema.js';

export type {
  User,
  Session,
  Workflow,
  NewWorkflow,
  Integration,
  NewIntegration,
  WorkflowExecution,
  NewWorkflowExecution,
  WorkflowExecutionLog,
  NewWorkflowExecutionLog,
  ApiKey,
  NewApiKey,
  WorkflowVisibility,
} from '../../lib/db/schema.js';

// Construct schema object for drizzle
export const schema = {
  users,
  sessions,
  accounts,
  verifications,
  workflows,
  workflowExecutions,
  workflowExecutionLogs,
  workflowExecutionsRelations,
  apiKeys,
  integrations,
};
