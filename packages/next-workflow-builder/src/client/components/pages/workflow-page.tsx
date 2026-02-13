"use client";

import { useParams } from "next/navigation";
import { WorkflowEditor } from "../workflow/workflow-editor";
import { HomePage } from "./home-page";
import { WorkflowsRedirect } from "./workflows-redirect";

const WorkflowPage = () => {
  const params = useParams<{ slug?: string[] }>();
  const slug = params.slug;

  // / → Home page (create new workflow)
  if (!slug || slug.length === 0) {
    return <HomePage />;
  }

  // /workflows → Redirect to most recent workflow
  if (slug[0] === "workflows" && slug.length === 1) {
    return <WorkflowsRedirect />;
  }

  // /workflows/[workflowId] → Workflow editor
  if (slug[0] === "workflows" && slug.length === 2) {
    return <WorkflowEditor workflowId={slug[1]} />;
  }

  return null;
};

export { WorkflowPage };
export default WorkflowPage;
