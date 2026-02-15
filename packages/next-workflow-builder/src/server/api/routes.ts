import { aiGatewayConsent } from "./handlers/ai-gateway/consent/route.js";
import { aiGatewayStatus } from "./handlers/ai-gateway/status/route.js";
import { aiGatewayTeams } from "./handlers/ai-gateway/teams/route.js";
import { aiGenerate } from "./handlers/ai/generate/route.js";
import { apiKeyHandler } from "./handlers/api-keys/[keyId]/route.js";
import { apiKeysHandler } from "./handlers/api-keys/route.js";
import { authHandler } from "./handlers/auth/route.js";
import { integrationHandler } from "./handlers/integrations/[integrationId]/route.js";
import { integrationTestHandler } from "./handlers/integrations/[integrationId]/test/route.js";
import { integrationsHandler } from "./handlers/integrations/route.js";
import { integrationsTestHandler } from "./handlers/integrations/test/route.js";
import { userHandler } from "./handlers/user/route.js";
import { executeScheduledWorkflow } from "./handlers/workflow/[workflowId]/cron/route.js";
import { executeWorkflowBackground } from "./handlers/workflow/[workflowId]/execute/route.js";
import { workflowCode } from "./handlers/workflows/[workflowId]/code/route.js";
import { workflowDownload } from "./handlers/workflows/[workflowId]/download/route.js";
import { workflowDuplicate } from "./handlers/workflows/[workflowId]/duplicate/route.js";
import { workflowExecute } from "./handlers/workflows/[workflowId]/execute/route.js";
import { workflowExecutionsHandler } from "./handlers/workflows/[workflowId]/executions/route.js";
import { workflowCrud } from "./handlers/workflows/[workflowId]/route.js";
import { workflowWebhook } from "./handlers/workflows/[workflowId]/webhook/route.js";
import { createWorkflow } from "./handlers/workflows/create/route.js";
import { currentWorkflow } from "./handlers/workflows/current/route.js";
import { executionLogs } from "./handlers/workflows/executions/[executionId]/logs/route.js";
import { executionStatus } from "./handlers/workflows/executions/[executionId]/status/route.js";
import { listWorkflows } from "./handlers/workflows/route.js";
import { RouteDefinition } from "./types.js";

const routes: RouteDefinition[] = [
  // AI
  { path: "/ai/generate", handler: aiGenerate, methods: ["POST"] },
  // AI Gateway (static routes first)
  { path: "/ai-gateway/consent", handler: aiGatewayConsent, methods: ["POST", "DELETE"] },
  { path: "/ai-gateway/status", handler: aiGatewayStatus, methods: ["GET"] },
  { path: "/ai-gateway/teams", handler: aiGatewayTeams, methods: ["GET"] },
  // API Keys (static routes before parameterized)
  { path: "/api-keys", handler: apiKeysHandler, methods: ["GET", "POST"] },
  { path: "/api-keys/[keyId]", handler: apiKeyHandler, methods: ["DELETE"] },
  // Auth
  { path: "/auth/[...all]", handler: authHandler, methods: ["GET", "POST"] },
  // Integrations (static routes before parameterized)
  { path: "/integrations/test", handler: integrationsTestHandler, methods: ["POST"] },
  { path: "/integrations", handler: integrationsHandler, methods: ["GET", "POST"] },
  { path: "/integrations/[integrationId]/test", handler: integrationTestHandler, methods: ["POST"] },
  { path: "/integrations/[integrationId]", handler: integrationHandler, methods: ["GET", "PUT", "DELETE"] },
  // User
  { path: "/user", handler: userHandler, methods: ["GET", "PATCH"] },
  // Workflow (singular - legacy execution endpoints)
  { path: "/workflow/[workflowId]/cron", handler: executeWorkflowBackground, methods: ["POST"] },
  { path: "/workflow/[workflowId]/execute", handler: executeWorkflowBackground, methods: ["POST"] },
  // Workflows (static routes before parameterized)
  { path: "/workflows/create", handler: createWorkflow, methods: ["POST"] },
  { path: "/workflows/current", handler: currentWorkflow, methods: ["GET", "POST"] },
  { path: "/workflows/executions/[executionId]/logs", handler: executionLogs, methods: ["GET"] },
  { path: "/workflows/executions/[executionId]/status", handler: executionStatus, methods: ["GET"] },
  { path: "/workflows/[workflowId]", handler: workflowCrud, methods: ["GET", "PATCH", "DELETE"] },
  { path: "/workflows/[workflowId]/code", handler: workflowCode, methods: ["GET"] },
  { path: "/workflows/[workflowId]/cron", handler: executeScheduledWorkflow, methods: ["GET"] },
  { path: "/workflows/[workflowId]/download", handler: workflowDownload, methods: ["GET"] },
  { path: "/workflows/[workflowId]/duplicate", handler: workflowDuplicate, methods: ["POST"] },
  { path: "/workflows/[workflowId]/execute", handler: workflowExecute, methods: ["POST"] },
  { path: "/workflows/[workflowId]/executions", handler: workflowExecutionsHandler, methods: ["GET", "DELETE"] },
  { path: "/workflows/[workflowId]/webhook", handler: workflowWebhook, methods: ["POST", "OPTIONS"] },
  { path: "/workflows", handler: listWorkflows, methods: ["GET"] },
];

export default routes;
