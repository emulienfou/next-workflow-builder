export type ActionType = {
  id: string;
  label: string;
  description: string;
  category: string;
  integration?: string;
};

// System actions that don't have plugins
export const SYSTEM_ACTIONS: ActionType[] = [
  {
    id: "HTTP Request",
    label: "HTTP Request",
    description: "Make an HTTP request to any API",
    category: "System",
  },
  {
    id: "Database Query",
    label: "Database Query",
    description: "Query your database",
    category: "System",
  },
  {
    id: "Condition",
    label: "Condition",
    description: "Branch based on a condition",
    category: "System",
  },
  {
    id: "Loop",
    label: "Loop",
    description: "Iterate over a list of items",
    category: "System",
  },
  {
    id: "Switch",
    label: "Switch",
    description: "Branch based on a condition",
    category: "System",
  },
];
