import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import solid from 'rolldown-plugin-solid'
import { withFilter } from 'rolldown/filter'
import { defineConfig } from 'tsdown'
import swc from 'unplugin-swc'

const require = createRequire(import.meta.url)
const solidJsPath = dirname(require.resolve('solid-js/package.json'))

/**
 * Resolve aliases to redirect solid-js server.js imports to client-side versions.
 * This is needed because solid-js uses conditional exports that resolve to
 * server.js in Node.js environment, but we need the client-side versions.
 */
const solidResolveAliases: Record<string, string> = {
  'solid-js/dist/server.js': join(solidJsPath, 'dist/solid.js'),
  'solid-js/store/dist/server.js': join(solidJsPath, 'store/dist/store.js'),
  'solid-js/web/dist/server.js': join(solidJsPath, 'web/dist/web.js'),
  // Also handle the bare module specifiers
  'solid-js': join(solidJsPath, 'dist/solid.js'),
  'solid-js/store': join(solidJsPath, 'store/dist/store.js'),
  'solid-js/web': join(solidJsPath, 'web/dist/web.js'),
}

const baseSwcConfig = {
  jsc: {
    target: 'es2022' as const,
    parser: {
      tsx: true,
      syntax: 'typescript' as const,
      decorators: true,
    },
    transform: {
      decoratorVersion: '2022-03' as const,
    },
  },
}

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/adapters/react/index.ts',
    'src/adapters/solid/index.tsx',
    'src/adapters/ink/index.ts',
  ],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  clean: true,
  treeshake: true,
  sourcemap: true,
  platform: 'node',
  dts: true,
  target: 'es2022',
  external: ['@opentui/core', '@opentui/react', 'react', '@navios/core', 'ink', 'ink-syntax-highlight', 'ink-virtual-list', 'fullscreen-ink'],
  alias: solidResolveAliases,
  noExternal: ['solid-js', 'solid-js/store', 'solid-js/web'],
  plugins: [
    // React adapter JSX transform (OpenTUI)
    withFilter(
      swc.rolldown({
        jsc: {
          ...baseSwcConfig.jsc,
          transform: {
            ...baseSwcConfig.jsc.transform,
            react: {
              runtime: 'automatic',
              importSource: '@opentui/react',
            },
          },
        },
      }),
      { transform: { id: '**/adapters/react/**' } },
    ),
    // Ink adapter JSX transform (standard React)
    withFilter(
      swc.rolldown({
        jsc: {
          ...baseSwcConfig.jsc,
          transform: {
            ...baseSwcConfig.jsc.transform,
            react: {
              runtime: 'automatic',
            },
          },
        },
      }),
      { transform: { id: '**/adapters/ink/**' } },
    ),
    // React-shared hooks JSX transform (standard React)
    withFilter(
      swc.rolldown({
        jsc: {
          ...baseSwcConfig.jsc,
          transform: {
            ...baseSwcConfig.jsc.transform,
            react: {
              runtime: 'automatic',
            },
          },
        },
      }),
      { transform: { id: '**/adapters/react-shared/**' } },
    ),
    // Solid adapter JSX transform using babel-preset-solid
    withFilter(
      solid({
        babel: {
          plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]],
        },
        solid: {
          moduleName: '@opentui/solid',
          generate: 'universal',
        },
      }),
      { transform: { id: '**/adapters/solid/**' } },
    ),
    // Default transform for non-adapter files (no JSX)
    swc.rolldown(baseSwcConfig),
  ],
})
