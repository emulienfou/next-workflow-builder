# Loop Plugin

Iterate over arrays and process downstream nodes for each item or batch. Similar to n8n's SplitInBatches node.

## Installation

The Loop plugin is a system plugin and is pre-installed in the `next-workflow-builder` package.

To use it in your project:

1. Add the import to your `plugins/index.ts`:
   ```ts
   import "@next-workflow-builder/loop";
   ```

2. Run `pnpm discover-plugins` (or build your project)

## Action

| ID             | Label | Description                                         |
|----------------|-------|-----------------------------------------------------|
| `loop/iterate` | Loop  | Split data into batches and iterate over each batch |

## Config Fields

| Key         | Label                 | Type           | Description                                                             |
|-------------|-----------------------|----------------|-------------------------------------------------------------------------|
| `items`     | Items to Iterate      | template-input | Reference an array from a previous node (e.g. `{{DatabaseQuery.rows}}`) |
| `batchSize` | Batch Size (optional) | template-input | Number of items per batch. Defaults to `1`                              |

## Output Fields

Downstream nodes can reference these via template variables (e.g. `{{Loop.currentItem}}`):

| Field               | Description                   |
|---------------------|-------------------------------|
| `currentItem`       | Current item being processed  |
| `currentBatch`      | Current batch of items        |
| `currentIndex`      | Current item index (0-based)  |
| `currentBatchIndex` | Current batch index (0-based) |
| `hasMore`           | Whether more batches remain   |
| `totalItems`        | Total number of items         |
| `totalBatches`      | Total number of batches       |
| `items`             | All items in the array        |
| `batchSize`         | Number of items per batch     |

## How It Works

The Loop plugin registers itself through the standard plugin system (`registerIntegration`). The workflow executor
retains special iteration logic for Loop nodes: after the step function runs, it re-executes all downstream nodes once
per batch, updating the Loop output context on each iteration.

This means the step function itself only evaluates the loop parameters (items, batch size, indices). The actual
iteration over downstream nodes is handled by `lib/workflow-executor.workflow.ts`.

## Backward Compatibility

Existing workflows that use the legacy action type `"Loop"` continue to work via two mechanisms:

1. **Legacy mapping** in `plugins/legacy-mappings.ts` maps `"Loop"` to `"loop/iterate"`, so `findActionById("Loop")`
   resolves to the plugin action.
2. **Workflow executor** checks for both `"Loop"` and `"loop/iterate"` when detecting loop nodes for special iteration
   handling.

## No Credentials Required

This plugin has no `formFields` and does not require any API keys or connections.
