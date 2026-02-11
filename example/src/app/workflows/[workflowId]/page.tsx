import { WorkflowEditor } from "next-workflow-builder/components/workflow/workflow-editor";

const Page = async (props: PageProps<"/workflows/[workflowId]">) => {
  const { workflowId } = await props.params;

  return (
    <WorkflowEditor workflowId={ workflowId }/>
  );
};

export default Page;
