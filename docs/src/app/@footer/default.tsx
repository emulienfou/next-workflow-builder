import Link from "next/link";
import { Footer } from "nextra-theme-docs";
import * as React from "react";

const currentYear = new Date().getFullYear();

const Default = () => (
  <Footer className="flex-col flex-grow">

    <div
      className="flex flex-col md:flex-row justify-between items-center text-xs gap-4">
      <p>© { currentYear } All rights reserved.</p>
      <div className="flex items-center gap-2">
        Product by <Link href="https://davidsanchez.me" target="_blank" rel="noopener noreferrer"
                         className="font-semibold">David Sanchez</Link>
      </div>
    </div>
  </Footer>
);

export default Default;
