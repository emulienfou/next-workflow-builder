import { createJiti } from "jiti";
import { join } from "node:path";
import { LIB_DIR, PLUGINS_DIR } from "./constants";

const jiti = createJiti(import.meta.url, {
  jsx: true,
});

/**
 * Dynamically import a TypeScript module from the consuming app's plugins directory.
 * Uses jiti to handle .ts files at runtime without requiring a bundler.
 */
export function importFromPlugins(relativePath: string) {
  const absolutePath = join(PLUGINS_DIR, relativePath);
  return jiti.import(absolutePath);
}

/**
 * Dynamically import a TypeScript module from the consuming app's lib directory.
 * Uses jiti to handle .ts files at runtime without requiring a bundler.
 */
export function importFromLib(relativePath: string) {
  const absolutePath = join(LIB_DIR, relativePath);
  return jiti.import(absolutePath);
}
