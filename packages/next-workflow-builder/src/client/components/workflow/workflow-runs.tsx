'use client';

import React from 'react';

export interface WorkflowRunsProps {
  className?: string;
}

export function WorkflowRuns({ className }: WorkflowRunsProps) {
  // TODO: Port workflow runs panel from Vercel template
  return (
    <div className={className} data-workflow-runs>
      <p>Workflow Runs — coming soon</p>
    </div>
  );
}
