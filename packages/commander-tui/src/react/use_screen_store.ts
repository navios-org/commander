import { useCallback, useSyncExternalStore } from 'react'

import type { ScreenInstance } from '../services/screen.ts'
import type { MessageData, PromptData } from '../types/index.ts'

const EMPTY_MESSAGES: MessageData[] = []

// useSyncExternalStore needs the same reference for the same state, so the
// copy of a screen's messages is kept until the screen says they changed.
const messagesCache = new WeakMap<ScreenInstance, { version: number; messages: MessageData[] }>()
const promptCache = new WeakMap<ScreenInstance, { version: number; prompt: PromptData | null }>()

/**
 * The messages of a screen. A burst of messages logged in one go renders
 * once: the view is told at the end of the current microtask, not for each.
 */
export function useScreenMessages(screen: ScreenInstance | null): MessageData[] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!screen) return () => {}

      let scheduled = false
      let subscribed = true
      const handleChange = () => {
        if (scheduled) return
        scheduled = true
        queueMicrotask(() => {
          scheduled = false
          if (subscribed) onStoreChange()
        })
      }

      screen.on('message:added', handleChange)
      screen.on('messages:cleared', handleChange)
      return () => {
        subscribed = false
        screen.off('message:added', handleChange)
        screen.off('messages:cleared', handleChange)
      }
    },
    [screen],
  )

  const getSnapshot = useCallback(() => {
    if (!screen) return EMPTY_MESSAGES
    // Compared by version, so that a screen that logged while another one was
    // shown is up to date when it is shown again.
    const version = screen.getMessagesVersion()
    let cached = messagesCache.get(screen)
    if (!cached || cached.version !== version) {
      cached = { version, messages: screen.getMessages() }
      messagesCache.set(screen, cached)
    }
    return cached.messages
  }, [screen])

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_MESSAGES)
}

/** The prompt a screen is asking, if any. */
export function useActivePrompt(screen: ScreenInstance | null): PromptData | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!screen) return () => {}

      const events = ['prompt:activated', 'prompt:updated', 'prompt:resolved'] as const
      for (const event of events) {
        screen.on(event, onStoreChange)
      }
      return () => {
        for (const event of events) {
          screen.off(event, onStoreChange)
        }
      }
    },
    [screen],
  )

  const getSnapshot = useCallback(() => {
    if (!screen) return null
    const version = screen.getPromptVersion()
    let cached = promptCache.get(screen)
    if (!cached || cached.version !== version) {
      cached = { version, prompt: screen.getActivePrompt() }
      promptCache.set(screen, cached)
    }
    return cached.prompt
  }, [screen])

  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
