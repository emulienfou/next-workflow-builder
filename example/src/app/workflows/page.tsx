import { WorkflowCanvas, WorkflowToolbar } from 'next-workflow-builder/components';

export default function WorkflowPage() {
  return (
    <div className="h-screen">
      <WorkflowToolbar />
      <WorkflowCanvas />
    </div>
  );
}
