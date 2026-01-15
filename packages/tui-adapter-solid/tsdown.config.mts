import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import solid from 'rolldown-plugin-solid'
import { defineConfig } from 'tsdown'

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

export default defineConfig({
  entry: ['src/index.tsx'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  clean: true,
  treeshake: true,
  sourcemap: true,
  platform: 'node',
  dts: true,
  target: 'es2022',
  external: ['@opentui/core', '@opentui/solid', '@navios/core', '@navios/commander-tui'],
  alias: solidResolveAliases,
  noExternal: ['solid-js', 'solid-js/store', 'solid-js/web'],
  plugins: [
    solid({
      babel: {
        plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]],
      },
      solid: {
        moduleName: '@opentui/solid',
        generate: 'universal',
      },
    }),
  ],
})
