import type { NextConfig } from 'next';
import { generateApiRoute } from './generate-route.js';

export interface WorkflowConfig {
  /** UI theme: 'light' | 'dark' | 'system'. Default: 'system' */
  theme?: 'light' | 'dark' | 'system';
  /** Base route for workflow API handlers. Default: '/api/workflow' */
  apiRoute?: string;
  /** Database connection string (required for persistence) */
  databaseUrl?: string;
  /** Enable AI-powered workflow generation */
  ai?: {
    provider?: 'openai' | 'anthropic';
    model?: string;
  };
  /** Enabled integration plugins */
  plugins?: string[];
  /** Auto-generate the catch-all API route file. Default: true */
  autoGenerateApiRoute?: boolean;
}

const defaultConfig: WorkflowConfig = {
  theme: 'system',
  apiRoute: '/api/workflow',
  autoGenerateApiRoute: true,
};

export default function workflowBuilder(workflowConfig: WorkflowConfig = {}) {
  const resolvedConfig = { ...defaultConfig, ...workflowConfig };

  if (resolvedConfig.autoGenerateApiRoute) {
    try {
      generateApiRoute({ apiRoute: resolvedConfig.apiRoute });
    } catch (err) {
      console.warn(
        '[next-workflow-builder] Failed to auto-generate API route:',
        err,
      );
    }
  }

  return (nextConfig: NextConfig = {}): NextConfig => ({
    ...nextConfig,
    transpilePackages: [
      ...(nextConfig.transpilePackages || []),
      'next-workflow-builder',
    ],
    env: {
      ...nextConfig.env,
      NEXT_WORKFLOW_THEME: resolvedConfig.theme,
      NEXT_WORKFLOW_API_ROUTE: resolvedConfig.apiRoute,
      ...(resolvedConfig.databaseUrl && {
        NEXT_WORKFLOW_DATABASE_URL: resolvedConfig.databaseUrl,
      }),
    },
    turbopack: {
      ...(nextConfig.turbopack ?? {}),
    },
  });
}
