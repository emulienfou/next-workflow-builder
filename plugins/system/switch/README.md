# Switch Plugin

Route data to different downstream paths based on rules or expressions. Similar to n8n's Switch node.

## Installation

The Switch plugin requires two things to work:

1. **Plugin files** (this directory) — registered automatically by `pnpm discover-plugins`
2. **Executor patch** — the workflow executor needs Switch-specific routing logic

### Step 1: Copy plugin files

Copy the `plugins/switch/` directory into your project's `plugins/` folder.

### Step 2: Add legacy mapping

Add the following entry to `plugins/legacy-mappings.ts` for backward compatibility with existing workflows that use the old `"Switch"` action type:

```ts
export const LEGACY_ACTION_MAPPINGS: Record<string, string> = {
  // ... existing mappings ...

  // Switch
  Switch: "switch/route",
};
```

### Step 3: Patch the workflow executor

The workflow executor (`lib/workflow-executor.workflow.ts`) must be patched to add Switch-specific logic. This cannot live in the plugin because the executor needs to:

- Parse rules from JSON strings into arrays
- Parse output index from strings to numbers (expression mode)
- Filter downstream edges by `sourceHandle` to route to the correct output
- Handle fallback routing when no rule matches

Apply the included patch file:

```bash
git apply plugins/switch/workflow-executor.patch
```

Or apply manually — the patch makes these changes to `lib/workflow-executor.workflow.ts`:

1. **`executeActionStep` function** — Add a Switch-specific block (after the Loop block) that parses `rules` from JSON strings, parses `outputIndex`, and invokes the step via the plugin registry
2. **`executeNode` function** — Add an `isSwitchNode` check (after `isLoopNode`) that reads `matchedOutput` from the result, filters edges by `sourceHandle` (`"output_0"`, `"output_1"`, ..., `"fallback"`), and executes only matched downstream nodes

### Step 4: Regenerate registries

```bash
pnpm discover-plugins
```

This updates the auto-generated files (`plugins/index.ts`, `lib/types/integration.ts`, `lib/step-registry.ts`, etc.) to include the Switch plugin.

### Step 5: Verify

```bash
pnpm build
```

Should complete with no type errors.

---

## Action

| ID | Label | Description |
|---|---|---|
| `switch/route` | Switch | Evaluate rules or expressions to route data to different outputs |

## Modes

### Rules Mode

Evaluate a value against an ordered list of rules. Each rule specifies an operator, a comparison value, and which output to route to. The first matching rule wins.

**Operators:** `equals`, `notEquals`, `contains`, `notContains`, `greaterThan`, `lessThan`, `startsWith`, `endsWith`, `regex`, `isEmpty`, `isNotEmpty`

### Expression Mode

A template expression resolves directly to an output index number. Useful when the routing decision is already computed by a previous node.

## Config Fields

| Key | Label | Type | Description |
|---|---|---|---|
| `mode` | Mode | select | `"rules"` or `"expression"` |
| `value` | Value to Evaluate | template-input | Value to test against rules (rules mode only) |
| `rules` | Rules (JSON array) | template-textarea | JSON array of `{ output, operator, value, name? }` objects |
| `outputExpression` | Output Index Expression | template-input | Expression returning an output index (expression mode only) |
| `fallbackOutput` | When No Rule Matches | select | `"none"` (discard) or `"fallback"` (route to fallback output) |

## Output Fields

Downstream nodes can reference these via template variables (e.g. `{{Switch.matchedOutput}}`):

| Field | Description |
|---|---|
| `matchedOutput` | Index of the matched output (0-based), or -1 if none |
| `matchedRuleName` | Name of the matched rule, if set |
| `matchedRuleIndex` | Index of the matched rule in the rules array |
| `value` | The value that was evaluated |
| `outputCount` | Total number of outputs |

## Edge Routing

Edges from Switch nodes use `sourceHandle` to identify which output they belong to:

- `"output_0"`, `"output_1"`, ... — Routes to the corresponding output index
- `"fallback"` — Routes when no rule matches (and fallbackOutput is `"fallback"`)
- `null`/undefined — Always executes (backward compatibility)

## File Structure

```
plugins/switch/
  index.ts                      # Plugin definition & registration
  icon.tsx                      # SVG icon component
  README.md                     # This file
  workflow-executor.patch        # Patch for lib/workflow-executor.workflow.ts
  steps/
    evaluate.ts                 # Step function (switchStep)
```

## How It Works

The Switch plugin registers itself through the standard plugin system (`registerIntegration`). The workflow executor retains special routing logic for Switch nodes: after the step function runs, it filters downstream edges by `sourceHandle` and only executes nodes connected to the matched output.

This means the step function itself only evaluates the routing logic (rules or expression). The actual selective downstream execution is handled by `lib/workflow-executor.workflow.ts`.

### Why the executor must be patched

Like Condition (which has branching logic in the executor) and Loop (which has iteration logic), Switch requires routing logic that controls *which* downstream nodes run. This is fundamentally an executor concern — a plugin step function can only return data, it cannot selectively execute sibling nodes. The patch adds this routing orchestration.

## Backward Compatibility

Existing workflows that use the legacy action type `"Switch"` continue to work via two mechanisms:

1. **Legacy mapping** in `plugins/legacy-mappings.ts` maps `"Switch"` to `"switch/route"`, so `findActionById("Switch")` resolves to the plugin action.
2. **Workflow executor** checks for both `"Switch"` and `"switch/route"` when detecting switch nodes for special routing handling.

If you remove or rename this plugin, remove the corresponding entry from `plugins/legacy-mappings.ts` as well.

## No Credentials Required

This plugin has no `formFields` and does not require any API keys or connections.
