import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

import type { ScreenManagerInstance, ScreenInstance, PromptData } from '@navios/commander-tui'
import type { Container } from '@navios/core'

import { ScreenManagerBridge } from '../../components/screen_manager_bridge.tsx'
import {
  createChoicePrompt,
  createConfirmPrompt,
  createInputPrompt,
  createMultiChoicePrompt,
  resetIdCounter,
} from '../mocks/factories.ts'

import { createTestScreenManager, testRender, TEST_DIMENSIONS } from './test_helpers.ts'

/**
 * Injects a prompt directly into a screen instance for testing.
 * This bypasses the normal prompt queue system which requires TUI_ACTIVE mode.
 */
function injectPrompt(screen: ScreenInstance, prompt: PromptData): void {
  // Access private activePrompt field for testing
  const screenWithPrivates = screen as unknown as {
    activePrompt: { data: PromptData; resolve: () => void } | null
    promptVersion: number
  }
  screenWithPrivates.activePrompt = {
    data: prompt,
    resolve: () => {},
  }
  screenWithPrivates.promptVersion++
}

describe('Prompts Integration', () => {
  let container: Container
  let manager: ScreenManagerInstance
  let screen: ScreenInstance

  beforeEach(async () => {
    resetIdCounter()
    const setup = await createTestScreenManager()
    container = setup.container
    manager = setup.manager
    screen = manager.createScreen({ name: 'Prompts', static: true })
  })

  afterEach(async () => {
    await container.dispose()
  })

  describe('ChoicePrompt', () => {
    it('should render choice prompt with default selection', async () => {
      injectPrompt(
        screen,
        createChoicePrompt({
          question: 'Which framework do you prefer?',
          choices: [
            { label: 'React', value: 'react' },
            { label: 'Vue', value: 'vue' },
            { label: 'Angular', value: 'angular' },
          ],
          selectedIndex: 0,
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

    it('should render choice prompt with second option selected', async () => {
      injectPrompt(
        screen,
        createChoicePrompt({
          question: 'Select a database:',
          choices: [
            { label: 'PostgreSQL', value: 'postgres' },
            { label: 'MySQL', value: 'mysql' },
            { label: 'SQLite', value: 'sqlite' },
          ],
          selectedIndex: 1,
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

    it('should render choice prompt with input option in input mode', async () => {
      injectPrompt(
        screen,
        createChoicePrompt({
          question: 'How would you like to proceed?',
          choices: [
            { label: 'Continue', value: 'continue' },
            { label: 'Skip', value: 'skip' },
            { label: 'Custom', value: 'custom', input: true },
          ],
          selectedIndex: 2,
          inputMode: true,
          inputValue: 'my custom value',
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

  describe('ConfirmPrompt', () => {
    it('should render confirm prompt with Yes selected', async () => {
      injectPrompt(
        screen,
        createConfirmPrompt({
          question: 'Are you sure you want to delete this file?',
          confirmText: 'Yes, delete',
          cancelText: 'Cancel',
          selectedValue: true,
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

    it('should render confirm prompt with No selected', async () => {
      injectPrompt(
        screen,
        createConfirmPrompt({
          question: 'Overwrite existing configuration?',
          confirmText: 'Overwrite',
          cancelText: 'Keep existing',
          selectedValue: false,
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

  describe('InputPrompt', () => {
    it('should render input prompt with placeholder', async () => {
      injectPrompt(
        screen,
        createInputPrompt({
          question: 'Enter your project name:',
          placeholder: 'my-awesome-project',
          value: '',
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

    it('should render input prompt with user input', async () => {
      injectPrompt(
        screen,
        createInputPrompt({
          question: 'What is your username?',
          placeholder: 'username',
          value: 'john_doe',
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

    it('should render input prompt with default value', async () => {
      injectPrompt(
        screen,
        createInputPrompt({
          question: 'Enter port number:',
          placeholder: '3000',
          defaultValue: '8080',
          value: '8080',
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

  describe('MultiChoicePrompt', () => {
    it('should render multi-choice prompt with no selections', async () => {
      injectPrompt(
        screen,
        createMultiChoicePrompt({
          question: 'Select features to enable:',
          choices: [
            { label: 'TypeScript', value: 'typescript' },
            { label: 'ESLint', value: 'eslint' },
            { label: 'Prettier', value: 'prettier' },
            { label: 'Jest', value: 'jest' },
          ],
          selectedIndices: new Set(),
          focusedIndex: 0,
          minSelect: 1,
          maxSelect: 4,
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

    it('should render multi-choice prompt with some selections', async () => {
      injectPrompt(
        screen,
        createMultiChoicePrompt({
          question: 'Select packages to install:',
          choices: [
            { label: 'lodash', value: 'lodash' },
            { label: 'axios', value: 'axios' },
            { label: 'moment', value: 'moment' },
          ],
          selectedIndices: new Set([0, 2]),
          focusedIndex: 1,
          minSelect: 0,
          maxSelect: 3,
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

    it('should render multi-choice prompt at max selections', async () => {
      injectPrompt(
        screen,
        createMultiChoicePrompt({
          question: 'Choose up to 2 colors:',
          choices: [
            { label: 'Red', value: 'red' },
            { label: 'Green', value: 'green' },
            { label: 'Blue', value: 'blue' },
          ],
          selectedIndices: new Set([0, 1]),
          focusedIndex: 2,
          minSelect: 1,
          maxSelect: 2,
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
