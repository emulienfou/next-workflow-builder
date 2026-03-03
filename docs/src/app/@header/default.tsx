import { Button } from "@/components/ui/button";
import { WorkflowIcon } from "@/components/workflow-icon";
import { appConfig } from "@/config/app";
import { GithubIcon } from "lucide-react";
import Link from "next/link";
import { Navbar } from "nextra-theme-docs";
import * as React from "react";

const Default = () => (
  <Navbar
    logo={
      <div className="flex items-center gap-8">
        <WorkflowIcon className="size-5 text-primary"/>
        <h2 className="text-lg font-bold tracking-tight">
          { appConfig.name }
        </h2>
      </div>
    }
    // ... Your additional navbar options
  >
    <Button size="sm" asChild>
      <Link href="https://github.com/emulienfou/next-workflow-builder" target="_blank" rel="noopener noreferrer">
        <GithubIcon/>
      </Link>
    </Button>
  </Navbar>
);

export default Default;
