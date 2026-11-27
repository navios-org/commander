import { RenderMode } from '@navios/commander-tui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { InputPromptData, ScreenInstance, ScreenManagerInstance } from '@navios/commander-tui'
import type { Container } from '@navios/core'

import { ScreenManagerBridge } from '../../components/screen_manager_bridge.tsx'
import { createChoicePrompt, createInputPrompt, resetIdCounter } from '../mocks/factories.ts'

import { createTestScreenManager, testRender, TEST_DIMENSIONS } from './test_helpers.ts'

const ESCAPE = '\u001b'
const BACKSPACE = '\u007f'

describe('Keyboard input (real Ink)', () => {
  let container: Container
  let manager: ScreenManagerInstance
  let screen: ScreenInstance

  beforeEach(async () => {
    resetIdCounter()
    const setup = await createTestScreenManager()
    container = setup.container
    manager = setup.manager
    // Prompts are only interactive while the TUI is active
    vi.spyOn(manager, 'getRenderMode').mockReturnValue(RenderMode.TUI_ACTIVE)
    screen = manager.createScreen({ name: 'Main', static: true })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await container.dispose()
  })

  it('escape exits prompt input mode', async () => {
    void screen._addPrompt(
      createChoicePrompt({
        choices: [{ label: 'Other', value: 'other', input: true }],
      }),
    )
    expect(screen.promptEnterInputMode()).toBe(true)

    const { stdin, unmount, waitForFrame } = await testRender(
      <ScreenManagerBridge manager={manager} />,
      TEST_DIMENSIONS,
    )
    await waitForFrame()

    stdin.write(ESCAPE)

    await vi.waitFor(() => expect(screen.isPromptInInputMode()).toBe(false))
    unmount()
  })

  it('backspace deletes the last typed character', async () => {
    void screen._addPrompt(createInputPrompt())

    const { stdin, unmount, waitForFrame } = await testRender(
      <ScreenManagerBridge manager={manager} />,
      TEST_DIMENSIONS,
    )
    await waitForFrame()
    const value = () => (screen.getActivePrompt() as InputPromptData).value

    stdin.write('a')
    stdin.write('b')
    await vi.waitFor(() => expect(value()).toBe('ab'))

    stdin.write(BACKSPACE)

    await vi.waitFor(() => expect(value()).toBe('a'))
    unmount()
  })
})
