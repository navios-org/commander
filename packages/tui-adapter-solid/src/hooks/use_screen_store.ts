import { createSignal, createEffect, onCleanup } from 'solid-js'

import type { ScreenInstance, MessageData, PromptData } from '@navios/commander-tui'
import type { Accessor } from 'solid-js'

/**
 * Creates a reactive accessor for screen messages.
 * Subscribes to `message:added` and `messages:cleared` events.
 */
export function createScreenMessages(
  screenAccessor: Accessor<ScreenInstance | null>,
): Accessor<MessageData[]> {
  const [messages, setMessages] = createSignal<MessageData[]>([])

  createEffect(() => {
    const screen = screenAccessor()
    if (!screen) {
      setMessages([])
      return
    }

    // Initialize with current messages
    setMessages(screen.getMessages())

    const events = ['message:added', 'messages:cleared'] as const

    const handler = () => {
      setMessages(screen.getMessages())
    }

    for (const event of events) {
      screen.on(event, handler)
    }

    onCleanup(() => {
      for (const event of events) {
        screen.off(event, handler)
      }
    })
  })

  return messages
}

/**
 * Creates a reactive accessor for the active prompt.
 * Subscribes to prompt events (`prompt:activated`, `prompt:updated`, `prompt:resolved`).
 */
export function createActivePrompt(
  screenAccessor: Accessor<ScreenInstance | null>,
): Accessor<PromptData | null> {
  const [prompt, setPrompt] = createSignal<PromptData | null>(null)

  createEffect(() => {
    const screen = screenAccessor()
    if (!screen) {
      setPrompt(null)
      return
    }

    // Initialize with current prompt
    setPrompt(screen.getActivePrompt())

    const events = ['prompt:activated', 'prompt:updated', 'prompt:resolved'] as const

    const handler = () => {
      setPrompt(screen.getActivePrompt())
    }

    for (const event of events) {
      screen.on(event, handler)
    }

    onCleanup(() => {
      for (const event of events) {
        screen.off(event, handler)
      }
    })
  })

  return prompt
}
