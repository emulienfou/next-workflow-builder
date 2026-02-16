import workflowBuilder from "next-workflow-builder";

// Set up WorkflowBuilder with its configuration
const withWorkflowBuilder = workflowBuilder({
  // ... Add Wor\kflowBuilder specific options here
  theme: "dark",
  plugins: {
    stepImporters: {
      "slack/send-message": {
        importer: () => import("@/plugins/slack/steps/send-slack-message"),
        stepFunction: "sendSlackMessageStep",
      },
      "Send Slack Message": {
        importer: () => import("@/plugins/slack/steps/send-slack-message"),
        stepFunction: "sendSlackMessageStep",
      },
    },
    actionLabels: {
      "slack/send-message": "Send Slack Message",
    },
  },
});

// Export the final Next.js config with workflowBuilder included
const nextConfig = withWorkflowBuilder({
  // ... Add regular Next.js options here
});

export default nextConfig;
