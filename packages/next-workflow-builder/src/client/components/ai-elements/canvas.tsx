import { Background, ReactFlow, type ReactFlowProps } from "@xyflow/react";
import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { canvasOptionsAtom } from "../../lib/workflow-store";
import "@xyflow/react/dist/style.css";

type CanvasProps = ReactFlowProps & {
  children?: ReactNode;
};

export const Canvas = ({ children, ...props }: CanvasProps) => {
  const canvasOptions = useAtomValue(canvasOptionsAtom);

  return (
    <ReactFlow
      deleteKeyCode={["Backspace", "Delete"]}
      fitView
      panActivationKeyCode={null}
      selectionOnDrag={false}
      snapToGrid={canvasOptions.snapToGrid ?? true}
      zoomOnDoubleClick={false}
      zoomOnPinch
      {...props}
    >
      <Background
        bgColor="var(--sidebar)"
        color="var(--border)"
        gap={24}
        size={2}
      />
      {children}
    </ReactFlow>
  );
};
