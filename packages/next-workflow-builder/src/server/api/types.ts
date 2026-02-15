import { BetterAuthOptions } from "better-auth";

export type AuthSession = {
  user: {
    id: string;
    [key: string]: any;
  };
};

export interface AuthInstance {
  api: {
    getSession: (opts: { headers: Headers }) => Promise<AuthSession | null>;
  };
}

export interface ParsedRoute {
  segments: string[];
  method: string;
  request: Request;
}

export interface WorkflowApiHandlerOptions {
  /** Drizzle database instance — must be created with the workflow schema */
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle db type varies by consumer
  db: any;
  /** Better Auth instance */
  authOptions?: BetterAuthOptions;
  /** Optional integration validation function */
  validateIntegrations?: (
    // biome-ignore lint/suspicious/noExplicitAny: Workflow nodes are JSONB
    nodes: any[],
    userId: string,
  ) => Promise<{ valid: boolean; invalidIds?: string[] }>;
  /** Optional function to start a workflow execution (e.g., Vercel workflow `start()`) */
  // biome-ignore lint/suspicious/noExplicitAny: Execution function signature varies
  startExecution?: (executionFn: any, args: any[]) => void;
  /** Optional workflow executor function passed to startExecution */
  // biome-ignore lint/suspicious/noExplicitAny: Executor type varies by consumer
  executeWorkflow?: any;
  /** Optional code generation function for the Code tab */
  // biome-ignore lint/suspicious/noExplicitAny: Node/edge types are JSONB
  generateCode?: (workflowName: string, nodes: any[], edges: any[]) => string;
  /** Optional download project generation function */
  // biome-ignore lint/suspicious/noExplicitAny: Workflow type varies
  generateDownload?: (workflow: any) => Promise<{
    success: boolean;
    files?: Record<string, string>;
    error?: string;
  }>;
}

export type HandlerContext = Omit<WorkflowApiHandlerOptions, "authOptions"> & { auth: AuthInstance };

export type RouteHandler = (
  route: ParsedRoute,
  ctx: HandlerContext,
) => Promise<Response>;

export type RouteDefinition = {
  path: string;
  handler: RouteHandler;
  methods: string[];
};
