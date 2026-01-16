import { createSignal, createEffect, onCleanup } from 'solid-js'

import type {
  ScreenInstance,
  MessageData,
  LoadingMessageData,
  ProgressMessageData,
} from '@navios/commander-tui'
import type { Accessor } from 'solid-js'

/**
 * Creates a reactive accessor that subscribes to updates for a specific message.
 * Returns the latest version of the message from the screen.
 *
 * This allows individual message components to re-render only when their
 * specific message is updated, rather than all messages re-rendering.
 */
export function createMessageUpdate<T extends MessageData>(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: T,
): Accessor<T> {
  const [message, setMessage] = createSignal<T>(initialMessage)

  createEffect(() => {
    const handler = (updatedId: string) => {
      if (updatedId === messageId) {
        // Find the message in the screen's message list
        const messages = screen.getMessages()
        const found = messages.find((m) => m.id === messageId)
        if (found) {
          // Use functional form to satisfy Solid's type system
          setMessage(() => found as T)
        }
      }
    }

    screen.on('message:updated', handler)

    onCleanup(() => {
      screen.off('message:updated', handler)
    })
  })

  return message
}

/**
 * Creates a reactive accessor specifically for loading messages that need to track their own updates.
 */
export function createLoadingMessageUpdate(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: LoadingMessageData,
): Accessor<LoadingMessageData> {
  return createMessageUpdate(screen, messageId, initialMessage)
}

/**
 * Creates a reactive accessor specifically for progress messages that need to track their own updates.
 */
export function createProgressMessageUpdate(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: ProgressMessageData,
): Accessor<ProgressMessageData> {
  return createMessageUpdate(screen, messageId, initialMessage)
}
