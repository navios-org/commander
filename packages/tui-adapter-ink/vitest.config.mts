import { defineProject } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineProject({
  plugins: [
    swc.vite({
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
          },
        },
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    typecheck: {
      enabled: true,
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
