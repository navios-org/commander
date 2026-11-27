import { useCallback, useSyncExternalStore } from 'react'

import type { ScreenInstance } from '../services/screen.ts'
import type { LoadingMessageData, MessageData, ProgressMessageData } from '../types/index.ts'

/**
 * A message that changes in place, such as a progress bar: the current
 * state of the message with this id.
 */
export function useMessageUpdate<T extends MessageData>(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: T,
): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = (updatedId: string) => {
        if (updatedId === messageId) {
          onStoreChange()
        }
      }
      screen.on('message:updated', handler)
      return () => screen.off('message:updated', handler)
    },
    [screen, messageId],
  )
  const getSnapshot = useCallback(
    () => (screen.getMessage(messageId) as T | undefined) ?? initialMessage,
    [screen, messageId, initialMessage],
  )
  return useSyncExternalStore(subscribe, getSnapshot, () => initialMessage)
}

export function useLoadingMessageUpdate(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: LoadingMessageData,
): LoadingMessageData {
  return useMessageUpdate(screen, messageId, initialMessage)
}

export function useProgressMessageUpdate(
  screen: ScreenInstance,
  messageId: string,
  initialMessage: ProgressMessageData,
): ProgressMessageData {
  return useMessageUpdate(screen, messageId, initialMessage)
}
