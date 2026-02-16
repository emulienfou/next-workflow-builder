/**
 * Post-build script: adds .js extensions to extensionless relative imports in dist/.
 * tsc with moduleResolution:"bundler" doesn't rewrite import specifiers,
 * but Node.js ESM requires explicit file extensions.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

// Matches: from "./foo" or from "../bar/baz" (no extension)
// Also handles: import("./foo") dynamic imports and export * from "./foo"
const RELATIVE_IMPORT_RE = /(from\s+["']|import\s*\(\s*["'])(\.\.?\/[^"']+)(["'])/g;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.name.endsWith('.js')) yield path;
  }
}

let fixedFiles = 0;

for await (const file of walk(DIST)) {
  const src = await readFile(file, 'utf8');
  const fixed = src.replace(RELATIVE_IMPORT_RE, (match, prefix, specifier, suffix) => {
    // Already has an extension
    if (/\.\w+$/.test(specifier)) return match;
    return `${prefix}${specifier}.js${suffix}`;
  });
  if (fixed !== src) {
    await writeFile(file, fixed);
    fixedFiles++;
  }
}

console.log(`Fixed ESM imports in ${fixedFiles} files.`);
