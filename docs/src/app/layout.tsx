import { appConfig } from "@/config/app";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Layout, Navbar } from "nextra-theme-docs";
import { Banner } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
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
  title: appConfig.name,
  description: appConfig.description,
};

const banner = <Banner storageKey="release-banner">{ appConfig.name } 1.0 is released 🎉</Banner>;
const navbar = (
  <Navbar
    logo={ <b>{ appConfig.name }</b> }
    // ... Your additional navbar options
  />
);

const RootLayout = async (props: LayoutProps<"/">) => {
  const pageMap = await getPageMap();

  return (
    <html lang="en" suppressHydrationWarning>
    <body
      className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }
    >
      <Layout
        banner={ banner }
        navbar={ props.header }
        pageMap={ pageMap }
        docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
        footer={ props.footer }
        // ... Your additional layout options
      >
        { props.children }
      </Layout>
    </body>
    </html>
  );
};

export default RootLayout;
