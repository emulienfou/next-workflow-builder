import type { NextConfig } from "next";
import nextWorkflowBuilder from "next-workflow-builder";

const withNextWorkflowBuilder = nextWorkflowBuilder({
  // NextWorkflowBuilder-specific options
});

export default withNextWorkflowBuilder({
  // Regular Next.js options
} satisfies NextConfig);
