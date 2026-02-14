import { defineConfig } from 'tsup';

export default defineConfig({
  name: 'next-workflow-builder',
  // 1. Try to point to "barrel" files (index.ts) if possible.
  // If you must use globs, try to keep them as narrow as possible.
  entry: [
    'src/server/**/*.ts',
    'src/lib/**/*.ts',
    'src/client/**/*.{ts,tsx}',
    'src/plugins/**/*.ts',
    'src/types.ts',
  ],
  format: ['esm'],
  // 2. This is the secret sauce.
  // experimentalDts uses a much more efficient way to generate types.
  dts: true,
  splitting: true,
  clean: true,
  sourcemap: true,
  bundle: false,
  // 3. Limit concurrency if you're on a machine with many cores but low RAM
  // concurrency: 4,
  external: [
    'react',
    'react-dom',
    'next',
    'shiki',
  ],
  async onSuccess() {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const clientPkgDir = path.resolve('dist', 'client');

    // Ensure the directory exists before writing to it
    await fs.mkdir(clientPkgDir, { recursive: true });
    await fs.writeFile(path.join(clientPkgDir, 'package.json'), '{"sideEffects":false}');

    // Copy styles to dist
    const stylesDir = path.resolve('dist', 'styles');
    await fs.mkdir(stylesDir, { recursive: true });
    await fs.copyFile(path.resolve('src/styles', 'globals.css'), path.join(stylesDir, 'globals.css'));
  },
});
