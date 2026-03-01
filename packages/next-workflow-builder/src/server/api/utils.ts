import { eq } from "drizzle-orm";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateWorkflowModule } from "../../client/lib/workflow-codegen";
import type { WorkflowEdge, WorkflowNode } from "../../client/lib/workflow-store";
import { getAllEnvVars, getDependenciesForActions } from "../../plugins";
import { NON_ALPHANUMERIC_REGEX, WHITESPACE_SPLIT_REGEX } from "../constants";
import { executeWorkflow } from "../lib/workflow-executor.workflow";
import { db } from "../db";
import { workflowExecutions } from "../db/schema";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Extract path segments after the /api/workflow-builder/ prefix.
 * Input URL: /api/workflow-builder/workflows/abc123/executions
 * Returns: ['workflows', 'abc123', 'executions']
 */
export function extractPath(request: Request): string[] {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Find the workflow-builder prefix and extract everything after it
  const prefix = "/api/workflow-builder/";
  const idx = pathname.indexOf(prefix);
  if (idx === -1) {
    // Fallback: try to extract path segments after /api/
    const apiIdx = pathname.indexOf("/api/");
    if (apiIdx === -1) return [];
    const afterApi = pathname.slice(apiIdx + 5);
    return afterApi.split("/").filter(Boolean);
  }

  const afterPrefix = pathname.slice(idx + prefix.length);
  return afterPrefix.split("/").filter(Boolean);
}

/**
 * Helper: rebuild a request with a new URL (for auth handler passthrough)
 */
export function rebuildRequest(request: Request, newUrl: string): Request {
  return new Request(newUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: "half",
  } as RequestInit & { duplex?: string });
}


export type WorkflowNodeLike = {
  id: string;
  data: { type?: string; config?: Record<string, unknown>; [k: string]: unknown };
  [k: string]: unknown
}
export type WorkflowEdgeLike = { id: string; source: string; target: string; [k: string]: unknown }

export async function executeWorkflowBackground(
  executionId: string,
  workflowId: string,
  nodes: WorkflowNodeLike[],
  edges: WorkflowEdgeLike[],
  input: Record<string, unknown>,
) {
  try {
    await executeWorkflow({
      nodes: nodes as Parameters<typeof executeWorkflow>[0]["nodes"],
      edges: edges as Parameters<typeof executeWorkflow>[0]["edges"],
      triggerInput: input,
      executionId,
      workflowId,
    });
  } catch (error) {
    console.error("[Workflow Execute] Error during execution:", error);
    await db
      .update(workflowExecutions)
      .set({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));
  }
}

export function buildWorkflowUpdateData(body: Record<string, unknown>): Record<string, unknown> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.nodes !== undefined) updateData.nodes = body.nodes;
  if (body.edges !== undefined) updateData.edges = body.edges;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;
  return updateData;
}

export function sanitizeNodesForPublicView(
  nodes: Record<string, unknown>[],
): Record<string, unknown>[] {
  return nodes.map((node) => {
    const sanitizedNode = { ...node };
    if (sanitizedNode.data && typeof sanitizedNode.data === "object" && sanitizedNode.data !== null) {
      const data = { ...(sanitizedNode.data as Record<string, unknown>) };
      if (data.config && typeof data.config === "object" && data.config !== null) {
        const { integrationId: _, ...configWithoutIntegration } = data.config as Record<string, unknown>;
        data.config = configWithoutIntegration;
      }
      sanitizedNode.data = data;
    }
    return sanitizedNode;
  });
}

/**
 * Recursively read all files from a directory
 */
export async function readDirectoryRecursive(
  dirPath: string,
  baseDir: string = dirPath
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively read subdirectories
      const subFiles = await readDirectoryRecursive(fullPath, baseDir);
      Object.assign(files, subFiles);
    } else if (entry.isFile()) {
      // Read file content
      const content = await readFile(fullPath, "utf-8");
      // Use relative path from base directory
      const relativePath = fullPath.substring(baseDir.length + 1);
      files[relativePath] = content;
    }
  }

  return files;
}

/**
 * Generate workflow-specific files
 */
export function generateWorkflowFiles(workflow: {
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}): Record<string, string> {
  const files: Record<string, string> = {};

  // Generate camelCase function name (same as Code tab)
  const baseName =
    workflow.name
      .replace(NON_ALPHANUMERIC_REGEX, "")
      .split(WHITESPACE_SPLIT_REGEX)
      .map((word, i) => {
        if (i === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("") || "execute";

  const functionName = `${baseName}Workflow`;

  // Generate code for the workflow using the same generator as the Code tab
  const workflowCode = generateWorkflowModule(
    workflow.name,
    workflow.nodes,
    workflow.edges,
    { functionName }
  );
  const fileName = sanitizeFileName(workflow.name);

  // Add workflow file
  files[`workflows/${fileName}.ts`] = workflowCode;

  // Add API route for this workflow
  files[`app/api/workflows/${fileName}/route.ts`] =
    `import { start } from 'workflow/api';
import { ${functionName} } from '@/workflows/${fileName}';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Start the workflow execution
    await start(${functionName}, [body]);
    
    return NextResponse.json({
      success: true,
      message: 'Workflow started successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
`;

  // Update app/page.tsx with workflow details
  files["app/page.tsx"] = `export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Workflow: ${workflow.name}</h1>
      <p className="mb-4 text-gray-600">API endpoint:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <a href="/api/workflows/${fileName}" className="text-blue-600 hover:underline">
            /api/workflows/${fileName}
          </a>
        </li>
      </ul>
    </main>
  );
}
`;

  return files;
}
/**
 * Get npm dependencies based on workflow nodes
 * Uses the plugin registry to dynamically determine required dependencies
 */
export function getIntegrationDependencies(
  nodes: WorkflowNode[]
): Record<string, string> {
  // Collect all action types used in the workflow
  const actionTypes = nodes
    .filter((node) => node.data.type === "action")
    .map((node) => node.data.config?.actionType as string)
    .filter(Boolean);

  // Get dependencies from plugin registry
  return getDependenciesForActions(actionTypes);
}

/**
 * Generate .env.example content based on registered integrations
 */
export function generateEnvExample(): string {
  const lines = ["# Add your environment variables here"];

  // Add system integration env vars
  lines.push("");
  lines.push("# For database integrations");
  lines.push("DATABASE_URL=your_database_url");

  // Add plugin env vars from registry
  const envVars = getAllEnvVars();
  const groupedByPrefix: Record<
    string,
    Array<{ name: string; description: string }>
  > = {};

  for (const envVar of envVars) {
    const prefix = envVar.name.split("_")[0];
    if (!groupedByPrefix[prefix]) {
      groupedByPrefix[prefix] = [];
    }
    groupedByPrefix[prefix].push(envVar);
  }

  for (const [prefix, vars] of Object.entries(groupedByPrefix)) {
    lines.push(
      `# For ${prefix.charAt(0) + prefix.slice(1).toLowerCase()} integration`
    );
    for (const v of vars) {
      lines.push(`${v.name}=your_${v.name.toLowerCase()}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Sanitize workflow name for use as file name
 */
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
