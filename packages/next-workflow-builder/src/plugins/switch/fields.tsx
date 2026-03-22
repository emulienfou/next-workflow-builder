"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "../../client/components/ui/button";
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
  const matchMode = (config?.matchMode as string) || "first";
  const routeCount = Number(config?.routeCount) || 4;

  const addRoute = () => {
    onUpdateConfig("routeCount", String(routeCount + 1));
  };

  const removeRoute = () => {
    if (routeCount <= 1) return;
    // Clear the last route's config keys
    const last = routeCount - 1;
    onUpdateConfig(`routeName${last}`, "");
    onUpdateConfig(`routeCondition${last}`, "");
    onUpdateConfig(`routeCaseValue${last}`, "");
    onUpdateConfig("routeCount", String(routeCount - 1));
  };

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
          { mode === "rules" && "Each route has a condition that is evaluated." }
          { mode === "expression" && "Compare a value against each route's case value." }
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="matchMode">Match</Label>
        <Select
          disabled={ disabled }
          onValueChange={ (value) => onUpdateConfig("matchMode", value) }
          value={ matchMode }
        >
          <SelectTrigger id="matchMode">
            <SelectValue placeholder="Select match mode"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first">First match</SelectItem>
            <SelectItem value="all">All matches</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          { matchMode === "first" && "Stop at the first matching route." }
          { matchMode === "all" && "Execute all routes whose condition is true." }
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

      { Array.from({ length: routeCount }, (_, i) => (
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
                placeholder={ `e.g., ${i === 0 ? "200" : i === 1 ? "404" : "500"}` }
                value={ (config?.[`routeCaseValue${i}`] as string) || "" }
              />
            </div>
          ) }
        </div>
      )) }

      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={ disabled }
          onClick={ addRoute }
          type="button"
          variant="outline"
        >
          <Plus className="mr-2 size-4" />
          Add Route
        </Button>
        <Button
          disabled={ disabled || routeCount <= 1 }
          onClick={ removeRoute }
          type="button"
          variant="outline"
        >
          <Minus className="size-4" />
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Routes are evaluated in order. If no route matches, the result falls back to "Default".
      </p>
    </div>
  );
}

export { SwitchFields };
