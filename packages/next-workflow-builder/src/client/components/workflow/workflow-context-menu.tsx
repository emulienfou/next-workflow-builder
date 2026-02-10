'use client';

import React from 'react';

export interface WorkflowContextMenuProps {
  className?: string;
}

export function WorkflowContextMenu({ className }: WorkflowContextMenuProps) {
  // TODO: Port context menu from Vercel template
  return (
    <div className={className} data-workflow-context-menu>
      <p>Workflow Context Menu — coming soon</p>
    </div>
  );
}
