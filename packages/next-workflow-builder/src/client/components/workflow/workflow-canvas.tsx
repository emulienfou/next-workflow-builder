'use client';

import React from 'react';

export interface WorkflowCanvasProps {
  className?: string;
  children?: React.ReactNode;
}

export function WorkflowCanvas({ className, children }: WorkflowCanvasProps) {
  // TODO: Port workflow canvas from Vercel template with @xyflow/react
  return (
    <div className={className} data-workflow-canvas>
      {children || <p>Workflow Canvas — coming soon</p>}
    </div>
  );
}
