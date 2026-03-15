"use client";

import { useAtomValue } from "jotai";
import { Check, Circle, EyeOff, ListOrdered, Loader2, XCircle } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { cn } from "../../../lib/utils";
import {
  executionLogsAtom,
  type WorkflowNodeData,
} from "../../../lib/workflow-store";
import { Node, NodeDescription, NodeTitle } from "../../ai-elements/node";

type ChildResult = {
  workflowId: string;
  workflowName: string;
  executionId: string;
  success: boolean;
  error?: string;
};

function ChildStatusIcon({ status }: { status: "pending" | "running" | "success" | "error" }) {
  switch (status) {
    case "pending":
      return <Circle className="size-3 text-muted-foreground"/>;
    case "running":
      return <Loader2 className="size-3 animate-spin text-blue-400"/>;
    case "success":
      return <Check className="size-3 text-green-400"/>;
    case "error":
      return <XCircle className="size-3 text-red-400"/>;
  }
}

function ChildWorkflowRow({
  index,
  name,
  status,
}: {
  index: number;
  name: string;
  status: "pending" | "running" | "success" | "error";
}) {
  return (
    <div
      className={ cn(
        "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] leading-tight transition-colors",
        status === "running" && "bg-blue-500/10",
        status === "success" && "bg-green-500/10",
        status === "error" && "bg-red-500/10",
      ) }
    >
      <span className="w-3 shrink-0 text-right text-muted-foreground">{ index }.</span>
      <ChildStatusIcon status={ status }/>
      <span className="min-w-0 flex-1 truncate">{ name }</span>
    </div>
  );
}

// StatusBadge for the compound node
function StatusBadge({ status }: { status?: "idle" | "running" | "success" | "error" }) {
  if (!status || status === "idle" || status === "running") return null;
  return (
    <div
      className={ cn(
        "absolute top-2 right-2 rounded-full p-1",
        status === "success" && "bg-green-500/50",
        status === "error" && "bg-red-500/50",
      ) }
    >
      { status === "success" && <Check className="size-3.5 text-white" strokeWidth={ 2.5 }/> }
      { status === "error" && <XCircle className="size-3.5 text-white" strokeWidth={ 2.5 }/> }
    </div>
  );
}

type SequenceNodeProps = {
  data: WorkflowNodeData;
  selected: boolean;
  id: string;
};

export const SequenceNode = memo(({ data, selected, id }: SequenceNodeProps) => {
  const executionLogs = useAtomValue(executionLogsAtom);
  const [workflowNames, setWorkflowNames] = useState<Record<string, string>>({});

  const status = data.status;
  const isDisabled = data.enabled === false;

  // Parse workflowIds from config
  const rawIds = (data.config?.workflowIds as string) || "[]";
  let workflowIds: string[] = [];
  try {
    const parsed = JSON.parse(rawIds);
    if (Array.isArray(parsed)) workflowIds = parsed;
  } catch {
    workflowIds = rawIds.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // Fetch workflow names
  useEffect(() => {
    if (workflowIds.length === 0) return;

    let cancelled = false;
    async function fetchNames() {
      try {
        const res = await fetch("/api/workflow-builder/workflows");
        if (!res.ok) return;
        const data = await res.json();
        const all = (data.workflows || data || []) as { id: string; name: string }[];
        const names: Record<string, string> = {};
        for (const w of all) {
          names[w.id] = w.name;
        }
        if (!cancelled) setWorkflowNames(names);
      } catch {
        // ignore
      }
    }
    fetchNames();
    return () => { cancelled = true; };
  }, [rawIds]);

  // Get child results from execution log output (after step completes)
  const nodeLog = executionLogs[id];
  const executionOutput = nodeLog?.output as
    | { results?: ChildResult[]; succeeded?: number; failed?: number }
    | undefined;
  const childResults = executionOutput?.results;

  // Build status map from child results
  const childStatusMap = new Map<string, "pending" | "running" | "success" | "error">();
  if (childResults) {
    for (const r of childResults) {
      childStatusMap.set(r.workflowId, r.success ? "success" : "error");
    }
  }

  // Determine per-child status
  function getChildStatus(workflowId: string, index: number): "pending" | "running" | "success" | "error" {
    // If we have execution results, use them
    if (childResults) {
      return childStatusMap.get(workflowId) || "pending";
    }
    // If the node is running but no results yet, all are pending
    // (real-time per-child polling would go here in a future enhancement)
    return "pending";
  }

  const isEmpty = workflowIds.length === 0;

  return (
    <Node
      className={ cn(
        "relative flex w-56 flex-col shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
        isDisabled && "opacity-50",
      ) }
      data-testid={ `action-node-${ id }` }
      handles={ { target: true, source: true } }
      status={ status }
    >
      { isDisabled && (
        <div className="absolute top-2 left-2 rounded-full bg-gray-500/50 p-1">
          <EyeOff className="size-3.5 text-white"/>
        </div>
      ) }
      <StatusBadge status={ status }/>

      {/* Header */ }
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <ListOrdered className="size-4 shrink-0 text-emerald-300" strokeWidth={ 1.5 }/>
        <div className="min-w-0 flex-1">
          <NodeTitle className="truncate text-xs font-medium">
            { data.label || "Run Workflows in Sequence" }
          </NodeTitle>
          { !isEmpty && (
            <NodeDescription className="text-[10px]">
              { workflowIds.length } workflow{ workflowIds.length !== 1 ? "s" : "" }
            </NodeDescription>
          ) }
        </div>
      </div>

      {/* Child workflow list */ }
      <div className="flex flex-col gap-0.5 px-2 py-2">
        { isEmpty ? (
          <p className="px-1 py-2 text-center text-[10px] text-muted-foreground">
            No workflows configured
          </p>
        ) : (
          workflowIds.map((wfId, index) => (
            <ChildWorkflowRow
              index={ index + 1 }
              key={ `${ wfId }-${ index }` }
              name={ workflowNames[wfId] || wfId.slice(0, 12) + "..." }
              status={ getChildStatus(wfId, index) }
            />
          ))
        ) }
      </div>

      {/* Summary footer when execution has results */ }
      { executionOutput && childResults && (
        <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
          { executionOutput.succeeded || 0 } passed
          { (executionOutput.failed || 0) > 0 && (
            <span className="text-red-400"> / { executionOutput.failed } failed</span>
          ) }
        </div>
      ) }
    </Node>
  );
});

SequenceNode.displayName = "SequenceNode";
