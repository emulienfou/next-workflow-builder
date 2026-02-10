export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  actions: PluginAction[];
  triggers?: PluginTrigger[];
}

export interface PluginAction {
  id: string;
  name: string;
  description: string;
  inputs: PluginField[];
  outputs: PluginField[];
}

export interface PluginTrigger {
  id: string;
  name: string;
  description: string;
  outputs: PluginField[];
}

export interface PluginField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'select';
  required?: boolean;
  options?: { label: string; value: string }[];
}

const pluginRegistry = new Map<string, PluginDefinition>();

export function registerPlugin(plugin: PluginDefinition) {
  pluginRegistry.set(plugin.id, plugin);
}

export function getPlugin(id: string): PluginDefinition | undefined {
  return pluginRegistry.get(id);
}

export function getAllPlugins(): PluginDefinition[] {
  return Array.from(pluginRegistry.values());
}
