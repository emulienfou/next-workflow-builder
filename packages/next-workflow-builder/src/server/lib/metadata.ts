import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "../db";
import { workflows } from "../db/schema";

/**
 * Generate metadata for the workflow editor page.
 * Only produces metadata for `/workflows/[workflowId]` paths.
 * Returns null for other paths so Next.js falls back to parent metadata.
 *
 * Respects visibility: only exposes workflow name for public workflows
 * to prevent private workflow name enumeration.
 *
 * Usage in `app/workflows/[workflowId]/page.tsx` or `layout.tsx`:
 * ```ts
 * export { generateWorkflowMetadata as generateMetadata } from "next-workflow-builder/server";
 * ```
 */
export async function generateWorkflowMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata | null> {
  const { slug } = await params;
  const [s1, s2] = slug;

  // Only generate metadata for /workflows/[workflowId]
  if (s1 !== "workflows" || !s2) {
    return null;
  }

  const workflowId = s2;

  let title = "Workflow";
  let isPublic = false;

  try {
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
      columns: {
        name: true,
        visibility: true,
      },
    });

    if (workflow) {
      isPublic = workflow.visibility === "public";
      // Only expose workflow name in metadata if it's public
      // This prevents private workflow name enumeration
      if (isPublic) {
        title = workflow.name;
      }
    }
  } catch {
    // Ignore errors, use defaults
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://workflow-builder.dev";
  const workflowUrl = `${ baseUrl }/workflows/${ workflowId }`;
  const ogImageUrl = isPublic
    ? `${ baseUrl }/api/og/workflow/${ workflowId }`
    : `${ baseUrl }/og-default.png`;

  return {
    title: `${ title } | AI Workflow Builder`,
    description: `View and explore the "${ title }" workflow built with AI Workflow Builder.`,
    openGraph: {
      title: `${ title } | AI Workflow Builder`,
      description: `View and explore the "${ title }" workflow built with AI Workflow Builder.`,
      type: "website",
      url: workflowUrl,
      siteName: "AI Workflow Builder",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${ title } workflow visualization`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${ title } | AI Workflow Builder`,
      description: `View and explore the "${ title }" workflow built with AI Workflow Builder.`,
      images: [ogImageUrl],
    },
  };
}
