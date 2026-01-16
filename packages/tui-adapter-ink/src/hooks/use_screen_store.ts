import { useSyncExternalStore, useCallback } from 'react'

import type { ScreenInstance, MessageData, PromptData } from '@navios/commander-tui'

const EMPTY_MESSAGES: MessageData[] = []

// External caches for stable references as required by useSyncExternalStore
const messagesCache = new WeakMap<ScreenInstance, MessageData[]>()
const promptCache = new WeakMap<ScreenInstance, { version: number; prompt: PromptData | null }>()

/**
 * Hook to subscribe to screen messages using useSyncExternalStore.
 * Uses external cache to ensure getSnapshot returns stable references.
 */
export function useScreenMessages(screen: ScreenInstance | null): MessageData[] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!screen) return () => {}

      const events = ['message:added', 'messages:cleared'] as const

      const handleChange = () => {
        // Update cache when data changes
        messagesCache.set(screen, screen.getMessages())
        onStoreChange()
      }

      for (const event of events) {
        screen.on(event, handleChange)
      }
      return () => {
        for (const event of events) {
          screen.off(event, handleChange)
        }
      }
    },
    [screen],
  )

  const getSnapshot = useCallback(() => {
    if (!screen) return EMPTY_MESSAGES
    // Return cached value if available, otherwise initialize cache
    let cached = messagesCache.get(screen)
    if (!cached) {
      cached = screen.getMessages()
      messagesCache.set(screen, cached)
    }
    return cached
  }, [screen])

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_MESSAGES)
}

/**
 * Hook to subscribe to the active prompt using useSyncExternalStore.
 * Uses version-based caching to ensure stable references when prompt hasn't changed.
 */
export function useActivePrompt(screen: ScreenInstance | null): PromptData | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!screen) return () => {}

      const events = ['prompt:activated', 'prompt:updated', 'prompt:resolved'] as const

      const handleChange = () => {
        // Update cache when prompt changes
        const currentVersion = screen.getPromptVersion()
        promptCache.set(screen, {
          version: currentVersion,
          prompt: screen.getActivePrompt(),
        })
        onStoreChange()
      }

      for (const event of events) {
        screen.on(event, handleChange)
      }
      return () => {
        for (const event of events) {
          screen.off(event, handleChange)
        }
      }
    },
    [screen],
  )

  const getSnapshot = useCallback(() => {
    if (!screen) return null
    const currentVersion = screen.getPromptVersion()
    let cached = promptCache.get(screen)
    if (!cached || cached.version !== currentVersion) {
      cached = {
        version: currentVersion,
        prompt: screen.getActivePrompt(),
      }
      promptCache.set(screen, cached)
    }
    return cached.prompt
  }, [screen])

  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
