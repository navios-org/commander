import { withFilter } from 'rolldown/filter'
import { defineConfig } from 'tsdown'
import swc from 'unplugin-swc'

export default defineConfig({
  entry: ['src/index.mts', 'src/legacy-compat/index.mts'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  clean: true,
  treeshake: true,
  sourcemap: true,
  platform: 'node',
  // tsconfig.json is solution-style (src is owned by the referenced
  // tsconfig.lib.json); TS 7's tsgo dts emit needs the owning project.
  dts: { tsconfig: 'tsconfig.lib.json' },
  target: 'es2022',
  plugins: [
    withFilter(
      swc.rolldown({
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            decoratorVersion: '2022-03',
          },
        },
      }),
      // Only run this transform if the file contains a decorator.
      { transform: { code: '@' } },
    ),
  ],
})
