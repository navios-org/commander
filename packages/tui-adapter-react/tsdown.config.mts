import { defineConfig } from 'tsdown'
import swc from 'unplugin-swc'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  clean: true,
  treeshake: true,
  sourcemap: true,
  platform: 'node',
  dts: true,
  target: 'es2022',
  external: ['@opentui/core', '@opentui/react', 'react', '@navios/core', '@navios/commander-tui'],
  plugins: [
    swc.rolldown({
      jsc: {
        target: 'es2022',
        parser: {
          tsx: true,
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorVersion: '2022-03',
          react: {
            runtime: 'automatic',
            importSource: '@opentui/react',
          },
        },
      },
    }),
  ],
})
