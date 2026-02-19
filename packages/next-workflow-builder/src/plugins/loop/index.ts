import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { LoopIcon } from "./icon";

const loopPlugin: IntegrationPlugin = {
  type: "Loop",
  label: "Loop",
  description: "Iterate over arrays and process items in batches",
  icon: LoopIcon,
  isBuiltIn: true,

  formFields: [],

  actions: [
    {
      slug: "iterate",
      label: "Loop",
      description: "Split data into batches and iterate over each batch",
      category: "System",
      stepFunction: "loopStep",
      stepImportPath: "iterate",
      configFields: [
        {
          key: "items",
          label: "Items to Iterate",
          type: "template-input",
          placeholder:
            "e.g., {{PreviousNode.rows}}, {{DatabaseQuery.results}}",
        },
        {
          key: "batchSize",
          label: "Batch Size (optional)",
          type: "template-input",
          placeholder: "1",
        },
      ],
      outputFields: [
        { field: "currentItem", description: "Current item being processed" },
        { field: "currentBatch", description: "Current batch of items" },
        {
          field: "currentIndex",
          description: "Current item index (0-based)",
        },
        {
          field: "currentBatchIndex",
          description: "Current batch index (0-based)",
        },
        { field: "hasMore", description: "Whether more batches remain" },
        { field: "totalItems", description: "Total number of items" },
        { field: "totalBatches", description: "Total number of batches" },
        { field: "items", description: "All items in the array" },
        { field: "batchSize", description: "Number of items per batch" },
      ],
    },
  ],
};

registerIntegration(loopPlugin);

export default loopPlugin;
