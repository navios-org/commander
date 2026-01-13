import { createSignal, createEffect, onCleanup } from 'solid-js'

import { LogMessage } from '../log/index.ts'

import type { LoadingMessageData, LogMessageVariant } from '../../../../types/index.ts'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export interface LoadingMessageProps {
  message: LoadingMessageData
}

export function LoadingMessage(props: LoadingMessageProps) {
  const [frameIndex, setFrameIndex] = createSignal(0)

  createEffect(() => {
    if (props.message.status === 'loading') {
      const interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length)
      }, 80)

      onCleanup(() => clearInterval(interval))
    }
  })

  // Map loading status to log level and variant for display
  const level = () => (props.message.status === 'fail' ? 'error' : 'log')
  const variant = (): LogMessageVariant | undefined =>
    props.message.status === 'success' ? 'success' : undefined

  const displayContent = () => props.message.resolvedContent ?? props.message.content
  const spinner = () => (props.message.status === 'loading' ? SPINNER_FRAMES[frameIndex()] + ' ' : '')

  return (
    <LogMessage level={level()} variant={variant()} timestamp={props.message.timestamp}>
      {spinner() + displayContent()}
    </LogMessage>
  )
}
