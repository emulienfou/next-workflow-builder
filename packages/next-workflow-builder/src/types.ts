export type { WorkflowConfig } from './server/plugin.js';
export type {
  PluginDefinition,
  PluginAction,
  PluginTrigger,
  PluginField,
} from './plugins/registry.js';
export type { WorkflowNodeType } from './lib/constants.js';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}
