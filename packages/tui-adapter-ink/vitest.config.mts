import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
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
          // Use different setup files based on test location
          // Unit tests (everything except integration/) use mocked setup
          // Integration tests don't use the mocked setup
          setupFiles: ['./src/__tests__/setup.ts'],
          exclude: ['src/__tests__/integration/**/*.spec.{ts,tsx}'],
          include: [
            // Unit tests - use mocked setup
            'src/__tests__/**/*.spec.{ts,tsx}',
          ],
        },
      },
      {
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
          environment: 'node', // Use node environment for real ink rendering
          typecheck: {
            enabled: true,
          },
          // No setup file - we want real Ink, not mocks
          include: ['src/__tests__/integration/**/*.spec.{ts,tsx}'],
        },
      },
    ],
  },
})
