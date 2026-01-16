import { useSyncExternalStore } from 'react'

import type {
  ScreenInstance,
  MessageData,
  LoadingMessageData,
  ProgressMessageData,
} from '@navios/commander-tui'

/**
 * Hook to subscribe to updates for a specific message.
 * Returns the latest version of the message from the screen.
 *
 * This allows individual message components to re-render only when their
 * specific message is updated, rather than all messages re-rendering.
 */
export function useMessageUpdate<T extends MessageData>(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: T,
): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      const handler = (updatedId: string) => {
        if (updatedId === messageId) {
          onStoreChange()
        }
      }
      screen.on('message:updated', handler)
      return () => screen.off('message:updated', handler)
    },
    () => {
      // Find the message in the screen's message list
      const messages = screen.getMessages()
      const message = messages.find((m) => m.id === messageId)
      return (message as T) ?? initialMessage
    },
    () => initialMessage,
  )
}

/**
 * Hook specifically for loading messages that need to track their own updates.
 */
export function useLoadingMessageUpdate(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: LoadingMessageData,
): LoadingMessageData {
  return useMessageUpdate(screen, messageId, initialMessage)
}

/**
 * Hook specifically for progress messages that need to track their own updates.
 */
export function useProgressMessageUpdate(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: ProgressMessageData,
): ProgressMessageData {
  return useMessageUpdate(screen, messageId, initialMessage)
}
