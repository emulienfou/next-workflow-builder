# Loop Plugin

Iterate over arrays and process downstream nodes for each item or batch. Similar to n8n's SplitInBatches node.

## Installation

The Loop plugin requires two things to work:

1. **Plugin files** (this directory) — registered automatically by `pnpm discover-plugins`
2. **Executor patch** — the workflow executor needs Loop-specific iteration logic

### Step 1: Copy plugin files

Copy the `plugins/loop/` directory into your project's `plugins/` folder.

### Step 2: Add legacy mapping

Add the following entry to `plugins/legacy-mappings.ts` for backward compatibility with existing workflows that use the old `"Loop"` action type:

```ts
export const LEGACY_ACTION_MAPPINGS: Record<string, string> = {
  // ... existing mappings ...

  // Loop
  Loop: "loop/iterate",
};
```

### Step 3: Patch the workflow executor

The workflow executor (`lib/workflow-executor.workflow.ts`) must be patched to add Loop-specific logic. This cannot live in the plugin because the executor needs to:

- Parse items from template-resolved strings/objects into arrays
- Re-execute downstream nodes once per batch (with fresh visited sets)
- Track loop context (current iteration) across child nodes

Apply the included patch file:

```bash
git apply plugins/loop/workflow-executor.patch
```

Or apply manually — the patch makes these changes to `lib/workflow-executor.workflow.ts`:

1. **`executeActionStep` function** — Add a Loop-specific block (after the Condition block) that parses `items` from strings/objects into arrays, parses `batchSize`, and invokes the step via the plugin registry
2. **`edgesByTarget` map** — Build a reverse-edge lookup alongside `edgesBySource` so downstream nodes can access upstream outputs
3. **`executeNode` function signature** — Add an optional `loopContext?: { iteration: number }` parameter and propagate it through all recursive calls (disabled nodes, condition branches, normal execution)
4. **`StepContext`** — Pass `loopIteration: loopContext?.iteration` when building step context
5. **Upstream output merging** — Merge source node outputs into step input so plugins can access previous step results directly
6. **`isLoopNode` detection** — After the `isConditionNode` check, add an `isLoopNode` check that matches both `"Loop"` and `"loop/iterate"`
7. **Loop iteration block** — When `isLoopNode` is true, iterate over batches sequentially, updating the loop node's output context per batch and re-executing downstream nodes with a fresh visited set

### Step 4: Regenerate registries

```bash
pnpm discover-plugins
```

This updates the auto-generated files (`plugins/index.ts`, `lib/types/integration.ts`, `lib/step-registry.ts`, etc.) to include the Loop plugin.

### Step 5: Verify

```bash
pnpm build
```

Should complete with no type errors.

---

## Action

| ID | Label | Description |
|---|---|---|
| `loop/iterate` | Loop | Split data into batches and iterate over each batch |

## Config Fields

| Key | Label | Type | Description |
|---|---|---|---|
| `items` | Items to Iterate | template-input | Reference an array from a previous node (e.g. `{{DatabaseQuery.rows}}`) |
| `batchSize` | Batch Size (optional) | template-input | Number of items per batch. Defaults to `1` |

## Output Fields

Downstream nodes can reference these via template variables (e.g. `{{Loop.currentItem}}`):

| Field | Description |
|---|---|
| `currentItem` | Current item being processed |
| `currentBatch` | Current batch of items |
| `currentIndex` | Current item index (0-based) |
| `currentBatchIndex` | Current batch index (0-based) |
| `hasMore` | Whether more batches remain |
| `totalItems` | Total number of items |
| `totalBatches` | Total number of batches |
| `items` | All items in the array |
| `batchSize` | Number of items per batch |

## File Structure

```
plugins/loop/
  index.ts                      # Plugin definition & registration
  icon.tsx                      # SVG icon component
  README.md                     # This file
  workflow-executor.patch        # Patch for lib/workflow-executor.workflow.ts
  steps/
    iterate.ts                  # Step function (loopStep)
```

## How It Works

The Loop plugin registers itself through the standard plugin system (`registerIntegration`). The workflow executor retains special iteration logic for Loop nodes: after the step function runs, it re-executes all downstream nodes once per batch, updating the Loop output context on each iteration.

This means the step function itself only evaluates the loop parameters (items, batch size, indices). The actual iteration over downstream nodes is handled by `lib/workflow-executor.workflow.ts`.

### Why the executor must be patched

Like Condition (which has branching logic in the executor), Loop requires iteration logic that controls *which* downstream nodes run and *how many times*. This is fundamentally an executor concern — a plugin step function can only return data, it cannot re-execute sibling nodes. The patch adds this iteration orchestration.

## Backward Compatibility

Existing workflows that use the legacy action type `"Loop"` continue to work via two mechanisms:

1. **Legacy mapping** in `plugins/legacy-mappings.ts` maps `"Loop"` to `"loop/iterate"`, so `findActionById("Loop")` resolves to the plugin action.
2. **Workflow executor** checks for both `"Loop"` and `"loop/iterate"` when detecting loop nodes for special iteration handling.

If you remove or rename this plugin, remove the corresponding entry from `plugins/legacy-mappings.ts` as well.

## No Credentials Required

This plugin has no `formFields` and does not require any API keys or connections.
