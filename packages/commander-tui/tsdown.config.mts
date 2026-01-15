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
  external: ['@opentui/core', '@navios/core'],
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
