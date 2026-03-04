# Switch

Route workflow execution based on rules or expression matching. Similar to n8n's Switch node, it evaluates multiple routing rules or matches a value against cases and outputs which route matched.

## Configuration

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| Mode | Select | Yes | `Rules` (condition per route) or `Expression` (match a value against cases) |

### Rules Mode

Each route has a boolean condition expression. Routes are evaluated in order — the first route whose condition is `true` wins.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| Route Name | Text Input | No | Optional label for the route (defaults to "Route 1", "Route 2", etc.) |
| Condition | Template Input | Yes | JavaScript expression that evaluates to true or false, e.g. `{{PreviousNode.status}} === 200` |

### Expression Mode

Compare a single value against each route's case value using string equality. First match wins.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| Value to Switch On | Template Input | Yes | The value to compare, e.g. `{{HTTPRequest.statusCode}}` |
| Route Name | Text Input | No | Optional label for the route |
| Case Value | Template Input | Yes | Value to match against, e.g. `200`, `404`, `error` |

Up to **4 routes** can be configured. If no route matches, the result falls back to a default.

## Output

| Field | Type | Description |
| --- | --- | --- |
| `matchedRouteIndex` | `number` | Index of the matched route (0-3), or `-1` if no match (default) |
| `matchedRouteName` | `string` | Name of the matched route, or `"Default"` if no match |
| `isDefault` | `boolean` | `true` when no route matched and the fallback was used |

## Usage Examples

### Route by HTTP status code (Expression mode)

1. **HTTP Request** — Call an external API
2. **Switch** — Mode: `Expression`, Value: `{{HTTPRequest.statusCode}}`
   - Route 1: Name `Success`, Case Value `200`
   - Route 2: Name `Not Found`, Case Value `404`
   - Route 3: Name `Server Error`, Case Value `500`
3. Use `{{Switch.matchedRouteName}}` in downstream nodes to handle each case

### Route by conditions (Rules mode)

1. **Database Query** — Fetch an order record
2. **Switch** — Mode: `Rules`
   - Route 1: Name `High Value`, Condition `{{DatabaseQuery.rows[0].total}} > 1000`
   - Route 2: Name `Medium Value`, Condition `{{DatabaseQuery.rows[0].total}} > 100`
   - Route 3: Name `Low Value`, Condition `{{DatabaseQuery.rows[0].total}} <= 100`
3. Branch logic based on `{{Switch.matchedRouteIndex}}`

### Categorize items

1. **Loop** — Iterate over a list of items
2. **Switch** — Mode: `Expression`, Value: `{{Loop.currentItem.type}}`
   - Route 1: Name `Email`, Case Value `email`
   - Route 2: Name `SMS`, Case Value `sms`
   - Route 3: Name `Push`, Case Value `push`
3. Process each category differently based on the matched route

## How It Works

The Switch step reconstructs routes from flat config keys (`routeName0`, `routeCondition0`, `routeCaseValue0`, etc.) into an ordered array.

- **Rules mode**: Iterates through routes in order. The first route with a `true` condition is selected.
- **Expression mode**: Compares the `switchValue` against each route's `caseValue` using string equality. The first match is selected.

If no route matches in either mode, the result returns `matchedRouteIndex: -1`, `matchedRouteName: "Default"`, and `isDefault: true`.

## Generated Code

```typescript
export async function switchStep(input: {
  mode: "rules" | "expression";
  switchValue?: string;
  routeName0?: string;
  routeCondition0?: boolean;
  routeCaseValue0?: string;
  // ... up to route 3
}) {
  "use step";

  const mode = input.mode || "rules";
  const routes = [];
  for (let i = 0; i < 4; i++) {
    const name = input[`routeName${i}`] || `Route ${i + 1}`;
    const condition = input[`routeCondition${i}`];
    const caseValue = input[`routeCaseValue${i}`];
    routes.push({ name, condition, caseValue });
  }

  if (mode === "rules") {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].condition === true) {
        return { matchedRouteIndex: i, matchedRouteName: routes[i].name, isDefault: false };
      }
    }
  } else {
    const switchValue = String(input.switchValue ?? "");
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].caseValue !== undefined && String(routes[i].caseValue) === switchValue) {
        return { matchedRouteIndex: i, matchedRouteName: routes[i].name, isDefault: false };
      }
    }
  }

  return { matchedRouteIndex: -1, matchedRouteName: "Default", isDefault: true };
}
```
