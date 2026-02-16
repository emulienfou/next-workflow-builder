import type { NextConfig } from "next";
import workflowNext from "workflow/next";

const { withWorkflow } = workflowNext;

export interface WorkflowConfig {
  /** UI theme: 'light' | 'dark' | 'system'. Default: 'system' */
  theme?: "light" | "dark" | "system";
  /** Base route for workflow API handlers. Default: '/api' */
  apiRoute?: string;
  /** Enable AI-powered workflow generation */
  ai?: {
    provider?: "openai" | "anthropic";
    model?: string;
  };
  /** Auto-generate the catch-all API route file. Default: true */
  autoGenerateApiRoute?: boolean;
  /** Import path for the database module in generated route. Default: '@/lib/db' */
  dbImportPath?: string;
  /** Import path for the auth module in generated route. Default: '@/lib/auth' */
  authImportPath?: string;
}

const defaultConfig: WorkflowConfig = {
  theme: "system",
  apiRoute: "/api",
  autoGenerateApiRoute: true,
};

const workflowBuilder = (workflowConfig: WorkflowConfig = {}) => {
  const resolvedConfig = { ...defaultConfig, ...workflowConfig };

  return (nextConfig: NextConfig = {}) => withWorkflow({
    ...nextConfig,
    transpilePackages: [
      ...(nextConfig.transpilePackages || []),
      "next-workflow-builder",
    ],
    env: {
      ...nextConfig.env,
      NEXT_WORKFLOW_THEME: resolvedConfig.theme,
      NEXT_WORKFLOW_API_ROUTE: resolvedConfig.apiRoute,
    },
    turbopack: {
      ...(nextConfig.turbopack ?? {}),
    },
  });
};

export default workflowBuilder;
