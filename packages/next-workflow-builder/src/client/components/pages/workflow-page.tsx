"use client";

import { AuthView } from "@daveyplate/better-auth-ui";
import { useParams } from "next/navigation";
import { WorkflowEditor } from "../workflow/workflow-editor";
import { HomePage } from "./home-page";
import { WorkflowsRedirect } from "./workflows-redirect";

const WorkflowPage = () => {
  const params = useParams<{ slug?: string[] }>();
  const slug = params.slug;
  console.log("slug", slug, params);

  // / → Home page (create new workflow)
  if (!slug || slug.length === 0) {
    return <HomePage/>;
  }

  // /auth/[path]
  if (slug[0] === "auth" && slug.length === 2) {
    return (
      <main className="container flex grow flex-col items-center justify-center self-center p-4 md:p-6">
        <AuthView path={ slug[1] }/>
      </main>
    );
  }

  // /workflows → Redirect to most recent workflow
  if (slug[0] === "workflows" && slug.length === 1) {
    return <WorkflowsRedirect/>;
  }

  // /workflows/[workflowId] → Workflow editor
  if (slug[0] === "workflows" && slug.length === 2) {
    return <WorkflowEditor workflowId={ slug[1] }/>;
  }

  return null;
};

export { WorkflowPage };
