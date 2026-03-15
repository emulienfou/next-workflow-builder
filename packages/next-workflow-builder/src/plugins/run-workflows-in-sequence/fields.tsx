"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../client/components/ui/button";
import { Label } from "../../client/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../client/components/ui/select";
import { TemplateBadgeInput } from "../../client/components/ui/template-badge-input";
import { cn } from "../../client/lib/utils";

type WorkflowOption = {
  id: string;
  name: string;
};

function RunWorkflowsInSequenceFields({
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
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchWorkflows();
  }, []);

  // Parse workflowIds from stored JSON string
  const rawIds = (config?.workflowIds as string) || "[]";
  let selectedIds: string[] = [];
  try {
    const parsed = JSON.parse(rawIds);
    if (Array.isArray(parsed)) selectedIds = parsed;
  } catch {
    // If not valid JSON, try comma-separated
    selectedIds = rawIds.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const updateIds = (ids: string[]) => {
    onUpdateConfig("workflowIds", JSON.stringify(ids));
  };

  const addWorkflow = (id: string) => {
    if (id && !selectedIds.includes(id)) {
      updateIds([...selectedIds, id]);
    }
  };

  const removeWorkflow = (index: number) => {
    const next = [...selectedIds];
    next.splice(index, 1);
    updateIds(next);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...selectedIds];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    updateIds(next);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const next = [...selectedIds];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    updateIds(next);
  };

  const getWorkflowName = (id: string) => {
    return workflows.find((w) => w.id === id)?.name || id;
  };

  // Workflows not yet in the list
  const availableWorkflows = workflows.filter((w) => !selectedIds.includes(w.id));

  const continueOnFailure = (config?.continueOnFailure as string) || "false";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Workflows (executed in order)</Label>
        { loading ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin"/>
            Loading workflows...
          </div>
        ) : (
          <div className="space-y-1">
            { selectedIds.map((id, index) => (
              <div
                className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1.5 text-sm"
                key={ `${id}-${index}` }
              >
                <span className="w-5 shrink-0 text-center text-muted-foreground text-xs">
                  { index + 1 }.
                </span>
                <span className="min-w-0 flex-1 truncate">
                  { getWorkflowName(id) }
                </span>
                <Button
                  className="size-6"
                  disabled={ disabled || index === 0 }
                  onClick={ () => moveUp(index) }
                  size="icon"
                  variant="ghost"
                >
                  <ArrowUp className="size-3"/>
                </Button>
                <Button
                  className="size-6"
                  disabled={ disabled || index === selectedIds.length - 1 }
                  onClick={ () => moveDown(index) }
                  size="icon"
                  variant="ghost"
                >
                  <ArrowDown className="size-3"/>
                </Button>
                <Button
                  className="size-6 text-destructive hover:text-destructive"
                  disabled={ disabled }
                  onClick={ () => removeWorkflow(index) }
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="size-3"/>
                </Button>
              </div>
            )) }

            { availableWorkflows.length > 0 && (
              <Select
                disabled={ disabled }
                onValueChange={ addWorkflow }
                value=""
              >
                <SelectTrigger className={ cn("w-full", selectedIds.length > 0 && "border-dashed") }>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Plus className="size-3.5"/>
                    <span>Add workflow...</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  { availableWorkflows.map((w) => (
                    <SelectItem key={ w.id } value={ w.id }>
                      { w.name }
                    </SelectItem>
                  )) }
                </SelectContent>
              </Select>
            ) }

            { !loading && workflows.length === 0 && (
              <p className="text-muted-foreground text-xs">No workflows found.</p>
            ) }
          </div>
        ) }
      </div>

      <div className="space-y-2">
        <Label htmlFor="continueOnFailure">On failure</Label>
        <Select
          disabled={ disabled }
          onValueChange={ (value) => onUpdateConfig("continueOnFailure", value) }
          value={ continueOnFailure }
        >
          <SelectTrigger className="w-full" id="continueOnFailure">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Stop sequence</SelectItem>
            <SelectItem value="true">Continue with next workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sequenceInput">Input (optional JSON, passed to all workflows)</Label>
        <TemplateBadgeInput
          disabled={ disabled }
          id="sequenceInput"
          onChange={ (value) => onUpdateConfig("input", value) }
          placeholder='{"key": "value"} or {{PreviousNode.field}}'
          value={ (config?.input as string) || "" }
        />
        <p className="text-muted-foreground text-xs">
          Optional JSON passed as trigger input to every workflow in the sequence.
        </p>
      </div>
    </div>
  );
}

export { RunWorkflowsInSequenceFields };
