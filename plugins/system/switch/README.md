# Switch Plugin

Route data to different downstream paths based on rules or expressions. Similar to n8n's Switch node.

## Installation

The Switch plugin is a system plugin and is pre-installed in the `next-workflow-builder` package.

To use it in your project:

1. Add the import to your `plugins/index.ts`:

```ts
import "@next-workflow-builder/switch"; 
```

2. Run `pnpm discover-plugins` (or build your project)

## Action

| ID             | Label  | Description                                                      |
|----------------|--------|------------------------------------------------------------------|
| `switch/route` | Switch | Evaluate rules or expressions to route data to different outputs |

## Modes

### Rules Mode

Evaluate a value against an ordered list of rules. Each rule specifies an operator, a comparison value, and which output
to route to. The first matching rule wins.

**Operators:** `equals`, `notEquals`, `contains`, `notContains`, `greaterThan`, `lessThan`, `startsWith`, `endsWith`,
`regex`, `isEmpty`, `isNotEmpty`

### Expression Mode

A template expression resolves directly to an output index number. Useful when the routing decision is already computed
by a previous node.

## Config Fields

| Key                | Label                   | Type              | Description                                                   |
|--------------------|-------------------------|-------------------|---------------------------------------------------------------|
| `mode`             | Mode                    | select            | `"rules"` or `"expression"`                                   |
| `value`            | Value to Evaluate       | template-input    | Value to test against rules (rules mode only)                 |
| `rules`            | Rules (JSON array)      | template-textarea | JSON array of `{ output, operator, value, name? }` objects    |
| `outputExpression` | Output Index Expression | template-input    | Expression returning an output index (expression mode only)   |
| `fallbackOutput`   | When No Rule Matches    | select            | `"none"` (discard) or `"fallback"` (route to fallback output) |

## Output Fields

Downstream nodes can reference these via template variables (e.g. `{{Switch.matchedOutput}}`):

| Field              | Description                                          |
|--------------------|------------------------------------------------------|
| `matchedOutput`    | Index of the matched output (0-based), or -1 if none |
| `matchedRuleName`  | Name of the matched rule, if set                     |
| `matchedRuleIndex` | Index of the matched rule in the rules array         |
| `value`            | The value that was evaluated                         |
| `outputCount`      | Total number of outputs                              |

## Edge Routing

Edges from Switch nodes use `sourceHandle` to identify which output they belong to:

- `"output_0"`, `"output_1"`, ... — Routes to the corresponding output index
- `"fallback"` — Routes when no rule matches (and fallbackOutput is `"fallback"`)
- `null`/undefined — Always executes (backward compatibility)

## How It Works

The Switch plugin registers itself through the standard plugin system (`registerIntegration`). The workflow executor
retains special routing logic for Switch nodes: after the step function runs, it filters downstream edges by
`sourceHandle` and only executes nodes connected to the matched output.

This means the step function itself only evaluates the routing logic (rules or expression). The actual selective
downstream execution is handled by `lib/workflow-executor.workflow.ts`.

## Backward Compatibility

Existing workflows that use the legacy action type `"Switch"` continue to work via two mechanisms:

1. **Legacy mapping** in `plugins/legacy-mappings.ts` maps `"Switch"` to `"switch/route"`, so `findActionById("Switch")`
   resolves to the plugin action.
2. **Workflow executor** checks for both `"Switch"` and `"switch/route"` when detecting switch nodes for special routing
   handling.

## No Credentials Required

This plugin has no `formFields` and does not require any API keys or connections.
