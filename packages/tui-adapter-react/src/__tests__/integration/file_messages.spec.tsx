import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

import type { ScreenManagerInstance, ScreenInstance } from '@navios/commander-tui'
import type { Container } from '@navios/core'

import { ScreenManagerBridge } from '../../components/screen_manager_bridge.tsx'
import {
  createFileMessage,
  createDiffMessage,
  createFileErrorMessage,
  resetIdCounter,
  STABLE_TIMESTAMP,
} from '../mocks/factories.ts'

import { createTestScreenManager, testRender, TEST_DIMENSIONS } from './test_helpers.ts'

describe('File Messages Integration', () => {
  let container: Container
  let manager: ScreenManagerInstance
  let screen: ScreenInstance

  beforeEach(async () => {
    resetIdCounter()
    const setup = await createTestScreenManager()
    container = setup.container
    manager = setup.manager
    screen = manager.createScreen({ name: 'Files', static: true })
  })

  afterEach(async () => {
    await container.dispose()
  })

  describe('FileMessage (full file)', () => {
    it('should render file with content', async () => {
      screen.addMessage(
        createFileMessage({
          filePath: '/src/components/Button.tsx',
          content: `import React from 'react'

export function Button({ children }) {
  return <button>{children}</button>
}`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render TypeScript file', async () => {
      screen.addMessage(
        createFileMessage({
          filePath: '/src/utils/helpers.ts',
          content: `export function add(a: number, b: number): number {
  return a + b
}

export const multiply = (x: number, y: number) => x * y`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render JSON file', async () => {
      screen.addMessage(
        createFileMessage({
          filePath: '/package.json',
          content: `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0"
  }
}`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })

  describe('DiffMessage', () => {
    it('should render unified diff', async () => {
      screen.addMessage(
        createDiffMessage({
          filePath: '/src/config.ts',
          diff: `--- a/src/config.ts
+++ b/src/config.ts
@@ -1,5 +1,6 @@
 export const config = {
   port: 3000,
-  host: 'localhost',
+  host: '0.0.0.0',
+  debug: true,
 }`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render diff with additions only', async () => {
      screen.addMessage(
        createDiffMessage({
          filePath: '/src/index.ts',
          diff: `--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,7 @@
 import { app } from './app'
+import { logger } from './logger'
+import { config } from './config'

-app.listen(3000)
+logger.info('Starting server...')
+app.listen(config.port)
+logger.info('Server started')`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render diff with deletions only', async () => {
      screen.addMessage(
        createDiffMessage({
          filePath: '/src/deprecated.ts',
          diff: `--- a/src/deprecated.ts
+++ b/src/deprecated.ts
@@ -1,8 +1,3 @@
 export function main() {
-  // Old implementation
-  console.log('deprecated')
-  legacyInit()
-}
-
-function legacyInit() {
-  // Remove this
+  // New implementation
 }`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })

  describe('FileErrorMessage (partial file with error highlighting)', () => {
    it('should render file excerpt with single error line', async () => {
      screen.addMessage(
        createFileErrorMessage({
          filePath: '/src/api.ts',
          content: `async function fetchData() {
  const response = await fetch(url)
  const data = response.json() // Missing await
  return data
}`,
          startLine: 10,
          errorLines: [12],
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render file excerpt with multiple error lines', async () => {
      screen.addMessage(
        createFileErrorMessage({
          filePath: '/src/validation.ts',
          content: `function validate(input: unknown) {
  if (input = null) { // Assignment instead of comparison
    return false
  }
  if (typeof input == 'string') { // Should use ===
    return true
  }
  return false
}`,
          startLine: 5,
          errorLines: [6, 9],
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render file excerpt starting from line 1', async () => {
      screen.addMessage(
        createFileErrorMessage({
          filePath: '/src/broken.ts',
          content: `import { missing } from 'nonexistent'
import { also } from 'missing-package'

export const value = missing()`,
          startLine: 1,
          errorLines: [1, 2],
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })

  describe('mixed file messages', () => {
    it('should render multiple file messages together', async () => {
      // Add a regular file
      screen.addMessage(
        createFileMessage({
          filePath: '/src/types.ts',
          content: `export interface User {
  id: string
  name: string
}`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      // Add a diff
      screen.addMessage(
        createDiffMessage({
          filePath: '/src/types.ts',
          diff: `@@ -1,4 +1,5 @@
 export interface User {
   id: string
   name: string
+  email: string
 }`,
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })
})
