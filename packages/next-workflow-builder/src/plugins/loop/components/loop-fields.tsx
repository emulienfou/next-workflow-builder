import { Label } from "../../../client/components/ui/label";
import { TemplateBadgeInput } from "../../../client/components/ui/template-badge-input";

// Loop fields component
function LoopFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="items">Items to Iterate</Label>
        <TemplateBadgeInput
          disabled={ disabled }
          id="items"
          onChange={ (value) => onUpdateConfig("items", value) }
          placeholder="e.g., {{PreviousNode.rows}}, {{DatabaseQuery.results}}"
          value={ (config?.items as string) || "" }
        />
        <p className="text-muted-foreground text-xs">
          Reference an array from a previous node. Use @ to reference outputs.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="batchSize">Batch Size (optional)</Label>
        <TemplateBadgeInput
          disabled={ disabled }
          id="batchSize"
          onChange={ (value) => onUpdateConfig("batchSize", value) }
          placeholder="1"
          value={ (config?.batchSize as string) || "" }
        />
        <p className="text-muted-foreground text-xs">
          Number of items per batch. Default is 1 (process one item at a time).
        </p>
      </div>
    </div>
  );
}

export { LoopFields };
