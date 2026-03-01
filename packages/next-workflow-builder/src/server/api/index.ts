import { NextResponse } from "next/server";
import { handleCreateApiKey, handleDeleteApiKey, handleGetApiKeys } from "./api-keys";
import { handleAuth } from "./auth";
import {
  handleCreateIntegration,
  handleDeleteIntegration,
  handleGetIntegration,
  handleGetIntegrations,
  handleTestIntegration,
  handleTestIntegrationCredentials,
  handleUpdateIntegration,
} from "./integrations";
import { handleGetUser, handleUpdateUser } from "./users";
import { corsHeaders, extractPath } from "./utils";
import {
  handleCreateWorkflow,
  handleDeleteWorkflow,
  handleDeleteWorkflowExecutions,
  handleDuplicateWorkflow,
  handleExecuteWorkflow,
  handleGetCurrentWorkflow,
  handleGetExecutionLogs,
  handleGetExecutionStatus,
  handleGetWorkflow,
  handleGetWorkflowCode,
  handleGetWorkflowDownload,
  handleGetWorkflowExecutions,
  handleGetWorkflows,
  handlePatchWorkflow,
  handleSaveCurrentWorkflow,
  handleWebhookWorkflow,
} from "./workflows";
import "virtual:workflow-builder-plugins";

// ============================================================================
// Main Router
// ============================================================================

async function route(request: Request): Promise<Response> {
  const segments = extractPath(request);
  const method = request.method.toUpperCase();

  if (segments.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [s0, s1, s2, s3] = segments;

  // Auth: auth/* (passthrough to better-auth)
  if (s0 === "auth") {
    return handleAuth(request, segments);
  }

  // Workflows list: GET /workflows, POST /workflows/create
  if (s0 === "workflows") {
    if (s1 === undefined) {
      if (method === "GET") return handleGetWorkflows(request);
    }

    if (s1 === "create") {
      if (method === "POST") return handleCreateWorkflow(request);
    }

    if (s1 === "current") {
      if (method === "GET") return handleGetCurrentWorkflow(request);
      if (method === "POST") return handleSaveCurrentWorkflow(request);
    }

    // Executions by executionId: /workflows/executions/[executionId]/status|logs
    if (s1 === "executions" && s2) {
      const executionId = s2;
      if (s3 === "status" && method === "GET") return handleGetExecutionStatus(request, executionId);
      if (s3 === "logs" && method === "GET") return handleGetExecutionLogs(request, executionId);
    }

    // Workflow by ID: /workflows/[workflowId]
    if (s1 && s1 !== "create" && s1 !== "current" && s1 !== "executions") {
      const workflowId = s1;

      if (s2 === undefined) {
        if (method === "GET") return handleGetWorkflow(request, workflowId);
        if (method === "PATCH") return handlePatchWorkflow(request, workflowId);
        if (method === "DELETE") return handleDeleteWorkflow(request, workflowId);
      }

      if (s2 === "code" && method === "GET") return handleGetWorkflowCode(request, workflowId);
      if (s2 === "download" && method === "GET") return handleGetWorkflowDownload(request, workflowId);
      if (s2 === "duplicate" && method === "POST") return handleDuplicateWorkflow(request, workflowId);
      if (s2 === "executions") {
        if (method === "GET") return handleGetWorkflowExecutions(request, workflowId);
        if (method === "DELETE") return handleDeleteWorkflowExecutions(request, workflowId);
      }
      if (s2 === "webhook" && method === "POST") return handleWebhookWorkflow(request, workflowId);
    }
  }

  // Single-workflow execute: /workflow/[workflowId]/execute
  if (s0 === "workflow" && s1 && s2 === "execute") {
    if (method === "POST") return handleExecuteWorkflow(request, s1);
  }

  // Integrations: /integrations/*
  if (s0 === "integrations") {
    if (s1 === undefined) {
      if (method === "GET") return handleGetIntegrations(request);
      if (method === "POST") return handleCreateIntegration(request);
    }

    if (s1 === "test" && s2 === undefined) {
      if (method === "POST") return handleTestIntegrationCredentials(request);
    }

    if (s1 && s1 !== "test") {
      const integrationId = s1;
      if (s2 === undefined) {
        if (method === "GET") return handleGetIntegration(request, integrationId);
        if (method === "PUT") return handleUpdateIntegration(request, integrationId);
        if (method === "DELETE") return handleDeleteIntegration(request, integrationId);
      }
      if (s2 === "test" && method === "POST") return handleTestIntegration(request, integrationId);
    }
  }

  // User: /user
  if (s0 === "user") {
    if (method === "GET") return handleGetUser(request);
    if (method === "PATCH") return handleUpdateUser(request);
  }

  // API Keys: /api-keys/*
  if (s0 === "api-keys") {
    if (s1 === undefined) {
      if (method === "GET") return handleGetApiKeys(request);
      if (method === "POST") return handleCreateApiKey(request);
    }
    if (s1 && s2 === undefined) {
      if (method === "DELETE") return handleDeleteApiKey(request, s1);
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// ============================================================================
// Exported HTTP Method Handlers
// ============================================================================

export async function GET(request: Request): Promise<Response> {
  return route(request);
}

export async function POST(request: Request): Promise<Response> {
  return route(request);
}

export async function PUT(request: Request): Promise<Response> {
  return route(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return route(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return route(request);
}

export async function OPTIONS(_request: Request): Promise<Response> {
  return NextResponse.json({}, { headers: corsHeaders });
}
