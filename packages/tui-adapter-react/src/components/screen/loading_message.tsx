import { useState, useEffect, useRef } from 'react'

import type { LoadingMessageData, LogMessageVariant, ScreenInstance } from '@navios/commander-tui'

import { useLoadingMessageUpdate } from '../../hooks/index.ts'
import { LogMessage } from '../log/index.ts'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export interface LoadingMessageProps {
  message: LoadingMessageData
  screen: ScreenInstance
}

/**
 * Loading message component that subscribes to its own update events.
 * This allows it to re-render only when this specific message is updated.
 */
export function LoadingMessage({ message: initialMessage, screen }: LoadingMessageProps) {
  // Subscribe to updates for this specific message
  const message = useLoadingMessageUpdate(screen, initialMessage.id, initialMessage)

  const [frameIndex, setFrameIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (message.status === 'loading') {
      intervalRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length)
      }, 80)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [message.status])

  // Map loading status to log level and variant for display
  const level = message.status === 'fail' ? 'error' : 'log'
  const variant: LogMessageVariant | undefined =
    message.status === 'success' ? 'success' : undefined

  const displayContent = message.resolvedContent ?? message.content
  const spinner = message.status === 'loading' ? SPINNER_FRAMES[frameIndex] + ' ' : ''

  return (
    <LogMessage level={level} variant={variant} timestamp={message.timestamp}>
      {spinner + displayContent}
    </LogMessage>
  )
}
