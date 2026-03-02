import type { Metadata, Viewport } from "next";
import { Layout } from "next-workflow-builder/client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "next-workflow-builder/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "AI Workflow Builder - Visual Workflow Automation",
  description:
    "Build powerful AI-driven workflow automations with a visual, node-based editor. Built with Next.js and React Flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body
      className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }
    >
      <Layout
        social={ { providers: ["vercel"] } }
      >
        { children }
      </Layout>
    </body>
    </html>
  );
}
