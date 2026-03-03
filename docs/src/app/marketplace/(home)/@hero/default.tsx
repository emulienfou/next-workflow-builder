import { Badge } from "@/components/ui/badge";
import { WorkflowIcon } from "@/components/workflow-icon";
import * as React from "react";

const Default = () => (
  <section className="flex flex-col items-center gap-8 px-4 pt-24 pb-16 text-center md:pt-32 md:pb-20">
    <Badge variant="outline" className="gap-2 px-3 py-1 text-sm font-normal">
      <WorkflowIcon className="size-3.5" />
      Community Plugins
    </Badge>

    <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
      Plugin Marketplace
    </h1>

    <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
      Discover, install, and use community-built plugins to extend your workflow builder with new integrations and
      capabilities.
    </p>
  </section>
);

export default Default;
