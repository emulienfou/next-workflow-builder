export function getWorkflowApiRoute(): string {
  return process.env.NEXT_WORKFLOW_API_ROUTE || '/api';
}

export function getWorkflowTheme(): string {
  return process.env.NEXT_WORKFLOW_THEME || 'system';
}
