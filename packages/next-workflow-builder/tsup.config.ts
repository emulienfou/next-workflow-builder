import { defineConfig } from 'tsup';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export default defineConfig({
  name: 'next-workflow-builder',
  entry: [
    'src/server/**/*.ts',
    'src/client/index.ts',
    'src/client/components/**/*.{ts,tsx}',
    'src/client/hooks/**/*.ts',
    'src/plugins/**/*.ts',
    'src/lib/**/*.ts',
    'src/types.ts',
  ],
  format: 'esm',
  dts: true,
  splitting: IS_PRODUCTION,
  clean: IS_PRODUCTION,
  bundle: false,
  external: [
    'react',
    'react-dom',
    'next',
    'shiki',
  ],
  async onSuccess() {
    // Write sideEffects: false for client tree-shaking
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const clientPkg = path.resolve('dist', 'client', 'package.json');
    await fs.writeFile(clientPkg, '{"sideEffects":false}');
  },
});
