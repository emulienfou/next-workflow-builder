"use client";

import { CodeBlock } from "@/components/code-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkflowIcon } from "@/components/workflow-icon";
import {
  ArrowRightIcon,
  BlocksIcon,
  BrainCircuitIcon,
  CodeIcon,
  GripIcon,
  PlayIcon,
  PlugIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function Hero() {
  return (
    <section className="flex flex-col items-center gap-8 px-4 pt-24 pb-16 text-center md:pt-32 md:pb-20">
      <Badge variant="outline" className="gap-2 px-3 py-1 text-sm font-normal">
        <WorkflowIcon className="size-3.5" />
        Built for Next.js 16
      </Badge>

      <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
        Visual Workflow Builder for Next.js
      </h1>

      <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
        A plugin that adds drag-and-drop workflow editing, code generation, AI-powered automation, and an extensible
        integration system to any Next.js application.
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Button size="lg" asChild className="h-11 rounded-full px-6 text-base">
          <Link href="/docs/getting-started">
            Get Started
            <ArrowRightIcon className="ml-1 size-4" />
          </Link>
        </Button>
        <div
          className="flex h-11 items-center gap-3 rounded-full border border-border/60 bg-muted/40 px-5 font-mono text-sm">
          <span className="text-muted-foreground">$</span>
          <span>npm i next-workflow-builder</span>
        </div>
      </div>
    </section>
  );
}

function Screenshot() {
  return (
    <section className="px-4 pb-20 md:pb-28">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-2xl">
          <Image
            src="https://raw.githubusercontent.com/vercel-labs/workflow-builder-template/main/screenshot.png"
            alt="Workflow Builder screenshot showing the visual drag-and-drop editor"
            width={1920}
            height={1080}
            className="w-full"
            priority
          />
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: GripIcon,
      title: "Drag-and-Drop Editor",
      description:
        "Build workflows visually with a node-based canvas. Connect triggers, actions, and conditions with an intuitive drag-and-drop interface powered by React Flow.",
    },
    {
      icon: PlugIcon,
      title: "Plugin System",
      description:
        "Extend with any third-party service. Each plugin defines credentials, actions, step handlers, and custom routes. Auto-discovered and type-safe.",
    },
    {
      icon: CodeIcon,
      title: "Code Generation",
      description:
        "Export any workflow as standalone TypeScript code. Download as a ZIP or view in the built-in code editor. Ready to run outside the builder.",
    },
    {
      icon: BrainCircuitIcon,
      title: "AI-Powered Generation",
      description:
        "Describe a workflow in natural language and let AI generate the nodes, edges, and configuration. Supports OpenAI and Anthropic providers.",
    },
    {
      icon: PlayIcon,
      title: "Real-Time Execution",
      description:
        "Run workflows with live status tracking and step-by-step logs. Support for webhooks, scheduled cron triggers, and manual execution.",
    },
    {
      icon: BlocksIcon,
      title: "Drop-In Integration",
      description:
        "Add to any Next.js app with a config wrapper, one API route, a layout provider, and a catch-all page. Full workflow platform in under 20 lines of code.",
    },
  ];

  return (
    <section className="bg-background px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to build workflows
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete workflow automation platform, packaged as a single Next.js plugin.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-border"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <feature.icon className="size-5 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SETUP_STEPS = [
  {
    step: "1",
    title: "Configure Next.js",
    file: "next.config.ts",
    code: `import workflowBuilder from "next-workflow-builder";

const withWorkflowBuilder = workflowBuilder({});

export default withWorkflowBuilder({});`,
  },
  {
    step: "2",
    title: "Create API route",
    file: "src/app/api/[...slug]/route.ts",
    code: `import { createWorkflowApiHandler } from "next-workflow-builder";

const handler = createWorkflowApiHandler({});

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
};`,
  },
  {
    step: "3",
    title: "Add layout and pages",
    file: "src/app/layout.tsx + src/app/[[...slug]]/page.tsx",
    code: `// layout.tsx
import { LayoutProvider } from "next-workflow-builder/components";
import "next-workflow-builder/styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}

// [[...slug]]/page.tsx
export { WorkflowPage as default } from "next-workflow-builder/components";`,
  },
];

function Setup() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three files. That&apos;s all it takes to add a complete workflow platform to your Next.js app.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {SETUP_STEPS.map((item) => (
            <div key={item.step} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                  {item.step}
                </span>
                <span className="font-semibold">{item.title}</span>
              </div>
              <CodeBlock code={item.code} filename={item.file} language="typescript" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLUGIN_CODE = `import { registerIntegration } from "next-workflow-builder/plugins";
import { MyServiceIcon } from "./icon";

const myPlugin = {
  type: "my-service",
  label: "My Service",
  description: "Connect to My Service",
  icon: MyServiceIcon,
  formFields: [
    { id: "apiKey", label: "API Key", type: "password",
      configKey: "apiKey", envVar: "MY_SERVICE_KEY" },
  ],
  actions: [
    { slug: "do-thing", label: "Do Thing",
      description: "Performs an action",
      category: "My Service",
      stepFunction: "doThingStep",
      stepImportPath: "do-thing",
      configFields: [
        { key: "input", label: "Input",
          type: "template-textarea", required: true },
      ],
      outputFields: [
        { field: "result", description: "The output" },
      ],
    },
  ],
};

registerIntegration(myPlugin);
export default myPlugin;`;

function PluginShowcase() {
  return (
    <section className="bg-background px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Extensible plugin system
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each plugin is a self-contained directory with credentials, actions, step handlers, and optional routes.
            Auto-discovered and fully typed.
          </p>
        </div>

        <CodeBlock code={PLUGIN_CODE} filename="plugins/my-service/index.ts" language="typescript" />
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div
        className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border border-border/60 bg-card p-10 text-center md:p-16">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Start building workflows today
        </h2>
        <p className="max-w-lg text-muted-foreground">
          Add a visual workflow builder to your Next.js app in minutes. Open source, fully typed, and extensible with
          plugins.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="h-11 rounded-full px-6 text-base">
            <Link href="/docs/getting-started">
              Get started
              <ArrowRightIcon className="ml-1 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-11 rounded-full px-6 text-base">
            <Link href="/docs">
              Read the docs
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Screenshot />
      <Features />
      <Setup />
      <PluginShowcase />
      <CTA />
    </div>
  );
}
