"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "../../client/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../client/components/ui/select";
import { TemplateBadgeInput } from "../../client/components/ui/template-badge-input";

type WorkflowOption = {
  id: string;
  name: string;
};

function RunWorkflowFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const res = await fetch("/api/workflow-builder/workflows");
        if (res.ok) {
          const data = await res.json();
          setWorkflows(
            (data.workflows || data || []).map((w: { id: string; name: string }) => ({
              id: w.id,
              name: w.name,
            })),
          );
        }
      } catch {
        // Silently fail — dropdown will be empty
      } finally {
        setLoading(false);
      }
    }
    fetchWorkflows();
  }, []);

  const selectedWorkflowId = (config?.workflowId as string) || "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workflowId">Workflow</Label>
        { loading ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin"/>
            Loading workflows...
          </div>
        ) : (
          <Select
            disabled={ disabled || workflows.length === 0 }
            onValueChange={ (value) => onUpdateConfig("workflowId", value) }
            value={ selectedWorkflowId || undefined }
          >
            <SelectTrigger className="w-full" id="workflowId">
              <SelectValue placeholder={ workflows.length === 0 ? "No workflows found" : "Select a workflow" }/>
            </SelectTrigger>
            <SelectContent>
              { workflows.map((w) => (
                <SelectItem key={ w.id } value={ w.id }>
                  { w.name }
                </SelectItem>
              )) }
            </SelectContent>
          </Select>
        ) }
        <p className="text-muted-foreground text-xs">
          The workflow to execute. It will run inline and wait for completion.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="input">Input (optional JSON)</Label>
        <TemplateBadgeInput
          disabled={ disabled }
          id="input"
          onChange={ (value) => onUpdateConfig("input", value) }
          placeholder='{"key": "value"} or {{PreviousNode.field}}'
          value={ (config?.input as string) || "" }
        />
        <p className="text-muted-foreground text-xs">
          Optional JSON passed as trigger input to the sub-workflow.
        </p>
      </div>
    </div>
  );
}

export { RunWorkflowFields };
