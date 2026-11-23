import { defineConfig } from 'tsdown'
import swc from 'unplugin-swc'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  clean: true,
  sourcemap: true,
  platform: 'node',
  dts: true,
  target: 'es2022',
  deps: {
    neverBundle: ['@opentui/core', '@navios/core', 'zod'],
    // Declarations import `zod/v4`; tsdown 0.23 only externalizes subpaths of
    // declared deps, so match the subpath explicitly (dts list replaces the JS one).
    dts: { neverBundle: ['@opentui/core', '@navios/core', /^zod(\/|$)/] },
  },
  plugins: [
    swc.rolldown({
      jsc: {
        target: 'es2022',
        parser: {
          tsx: false,
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorVersion: '2022-03',
        },
      },
    }),
  ],
})
