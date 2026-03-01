import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "tsup";
import { $ } from "zx";

export default defineConfig({
  name: "next-workflow-builder",
  entry: [
    "src/next/index.ts",
    "src/client/index.ts",
    "src/plugins/index.ts",
    "src/server/index.ts",
    "src/server/api/index.ts",
  ],
  format: "esm",
  dts: true,
  clean: true,
  external: [
    "next",
    "react",
    "react-dom",
    "webpack",
    "typescript",
    "prettier",
    /^node:/,
    "virtual:workflow-builder-plugins",
    "virtual:workflow-builder-step-registry",
  ],
  async onSuccess() {
    // Ensure "use client" directive is present in client bundle
    const clientEntry = path.resolve("dist", "client", "index.js");
    const clientContent = await fs.readFile(clientEntry, "utf8");
    if (!clientContent.startsWith('"use client"')) {
      await fs.writeFile(clientEntry, `"use client";\n${clientContent}`);
      console.log('✅ Added "use client" directive to dist/client/index.js');
    }

    // Use Tailwind CSS CLI because CSS processing by tsup produce different result
    await $`npx @tailwindcss/cli -i src/client/styles.css -o dist/styles.css`;
    const styleContent = await fs.readFile(
      path.resolve("dist", "styles.css"),
      "utf8",
    );
    await fs.writeFile(
      path.resolve("dist", "style-prefixed.css"),
      styleContent
        .replaceAll("@layer utilities", "@layer v4-utilities")
        .replaceAll("@layer base", "@layer v4-base")
        .replace(
          "@layer theme, base, components, utilities",
          "@layer theme, v4-base, components, v4-utilities",
        ),
    );
    console.log("✅ `dist/style-prefixed.css` successfully created");
  },
});
