import { DatabaseIcon } from "lucide-react";
import type { IntegrationPlugin } from "../registry";

const databasePlugin: IntegrationPlugin = {
  type: "database",
  label: "Database",
  description: "",
  icon: DatabaseIcon,
  isBuiltIn: true,

  formFields: [],

  actions: [
    {
      slug: "query",
      label: "Query",
      description: "Execute a database query",
      category: "Database",
      stepFunction: "databaseQueryStep",
      stepImportPath: "query",
      configFields: [],
      outputFields: [],
    },
  ],
};

export default databasePlugin;
