export interface AppConfig {
  // App/SEO name
  name: string;
  // Hero title
  title: string;
  // App/SEO description
  description: string;
}

const appConfig: AppConfig = {
  name: "next-workflow-builder",
  title: "Next.js Workflow Builder",
  description: "A Next.js plugin for visual workflow building with drag-and-drop, code generation, and AI-powered automation.",
};

export { appConfig };
