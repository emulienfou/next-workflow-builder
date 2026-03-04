"use client";

import { Input } from "../../client/components/ui/input";
import { Label } from "../../client/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../client/components/ui/select";
import { TemplateBadgeInput } from "../../client/components/ui/template-badge-input";

function SwitchFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const mode = (config?.mode as string) || "rules";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mode">Mode</Label>
        <Select
          disabled={ disabled }
          onValueChange={ (value) => onUpdateConfig("mode", value) }
          value={ mode }
        >
          <SelectTrigger id="mode">
            <SelectValue placeholder="Select mode"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rules">Rules</SelectItem>
            <SelectItem value="expression">Expression</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          { mode === "rules" && "Each route has a condition. The first route whose condition is true wins." }
          { mode === "expression" && "Compare a value against each route's case value. First match wins." }
        </p>
      </div>

      { mode === "expression" && (
        <div className="space-y-2">
          <Label htmlFor="switchValue">Value to Switch On</Label>
          <TemplateBadgeInput
            disabled={ disabled }
            id="switchValue"
            onChange={ (value) => onUpdateConfig("switchValue", value) }
            placeholder="e.g., {{PreviousNode.statusCode}}"
            value={ (config?.switchValue as string) || "" }
          />
          <p className="text-muted-foreground text-xs">
            The value to compare against each route's case value. Use @ to reference previous node outputs.
          </p>
        </div>
      ) }

      { [0, 1, 2, 3].map((i) => (
        <div className="space-y-3 rounded-md border p-3" key={ i }>
          <p className="font-medium text-sm">Route { i + 1 }</p>

          <div className="space-y-2">
            <Label htmlFor={ `routeName${i}` }>Name (optional)</Label>
            <Input
              disabled={ disabled }
              id={ `routeName${i}` }
              onChange={ (e) => onUpdateConfig(`routeName${i}`, e.target.value) }
              placeholder={ `Route ${i + 1}` }
              value={ (config?.[`routeName${i}`] as string) || "" }
            />
          </div>

          { mode === "rules" && (
            <div className="space-y-2">
              <Label htmlFor={ `routeCondition${i}` }>Condition</Label>
              <TemplateBadgeInput
                disabled={ disabled }
                id={ `routeCondition${i}` }
                onChange={ (value) => onUpdateConfig(`routeCondition${i}`, value) }
                placeholder="e.g., {{PreviousNode.status}} === 200"
                value={ (config?.[`routeCondition${i}`] as string) || "" }
              />
            </div>
          ) }

          { mode === "expression" && (
            <div className="space-y-2">
              <Label htmlFor={ `routeCaseValue${i}` }>Case Value</Label>
              <TemplateBadgeInput
                disabled={ disabled }
                id={ `routeCaseValue${i}` }
                onChange={ (value) => onUpdateConfig(`routeCaseValue${i}`, value) }
                placeholder={ `e.g., ${i === 0 ? "200" : i === 1 ? "404" : i === 2 ? "500" : "default"}` }
                value={ (config?.[`routeCaseValue${i}`] as string) || "" }
              />
            </div>
          ) }
        </div>
      )) }

      <p className="text-muted-foreground text-xs">
        Routes are evaluated in order. The first matching route wins. If no route matches, the result falls back to "Default".
      </p>
    </div>
  );
}

export { SwitchFields };
