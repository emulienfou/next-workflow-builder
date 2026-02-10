import workflowBuilder from "next-workflow-builder";

// Set up WorkflowBuilder with its configuration
const withWorkflowBuilder = workflowBuilder({
  // ... Add WorkflowBuilder specific options here
  theme: "dark",
});

// Export the final Next.js config with workflowBuilder included
const nextConfig = withWorkflowBuilder({
  // ... Add regular Next.js options here
});

export default nextConfig;
