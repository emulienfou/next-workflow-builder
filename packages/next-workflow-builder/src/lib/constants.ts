export const WORKFLOW_NODE_TYPES = [
  'trigger',
  'action',
  'condition',
  'loop',
  'delay',
  'webhook',
  'code',
  'ai',
] as const;

export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];
