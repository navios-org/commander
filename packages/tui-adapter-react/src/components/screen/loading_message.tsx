import { useState, useEffect, useRef } from 'react'

import type { LoadingMessageData, LogMessageVariant } from '@navios/commander-tui'

import { LogMessage } from '../log/index.ts'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export interface LoadingMessageProps {
  message: LoadingMessageData
}

export function LoadingMessage({ message }: LoadingMessageProps) {
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
