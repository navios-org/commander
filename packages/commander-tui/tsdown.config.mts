import { defineConfig } from 'tsdown'
import swc from 'unplugin-swc'

console.log('zod')
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  clean: true,
  sourcemap: true,
  platform: 'node',
  dts: true,
  target: 'es2022',
  external: ['@opentui/core', '@navios/core', 'zod'],
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
