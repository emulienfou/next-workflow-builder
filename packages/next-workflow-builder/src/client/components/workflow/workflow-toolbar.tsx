'use client';

import React from 'react';

export interface WorkflowToolbarProps {
  className?: string;
}

export function WorkflowToolbar({ className }: WorkflowToolbarProps) {
  // TODO: Port workflow toolbar from Vercel template
  return (
    <div className={className} data-workflow-toolbar>
      <p>Workflow Toolbar — coming soon</p>
    </div>
  );
}
