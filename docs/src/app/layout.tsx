import GAProvider from "@/components/ga-provider";
import { appConfig } from "@/config/app";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Layout } from "nextra-theme-docs";
import { Banner } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import * as React from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${ appConfig.name }`,
  },
  description: appConfig.description,
};

const banner = <Banner storageKey="release-banner">{ appConfig.name } 1.0 is released 🎉</Banner>;

const RootLayout = async (props: LayoutProps<"/">) => {
  const pageMap = await getPageMap();

  return (
    <html lang="en" suppressHydrationWarning>
    <body
      className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }
    >
      <React.Suspense>
        <Layout
          // banner={ banner }
          navbar={ props.header }
          pageMap={ pageMap }
          docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
          footer={ props.footer }
          // ... Your additional layout options
        >
          <GAProvider>{ props.children }</GAProvider>
        </Layout>
      </React.Suspense>
    </body>
    </html>
  );
};

export default RootLayout;
