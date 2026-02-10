'use client';

import React from 'react';

export interface PersistentCanvasProps {
  className?: string;
  children?: React.ReactNode;
}

export function PersistentCanvas({ className, children }: PersistentCanvasProps) {
  // TODO: Port persistent canvas with auto-save from Vercel template
  return (
    <div className={className} data-persistent-canvas>
      {children || <p>Persistent Canvas — coming soon</p>}
    </div>
  );
}
