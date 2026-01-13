import { describe, expect, it } from 'vitest'

import { LoadingMessage } from '../../adapters/react/components/screen/loading_message.tsx'
import { createLoadingMessage } from '../utils/factories.ts'
import { wrapWithContext } from '../utils/render-utils.tsx'

describe('LoadingMessage', () => {
  describe('loading state', () => {
    it('should render loading state', () => {
      const message = createLoadingMessage({
        content: 'Loading data...',
        status: 'loading',
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should render loading with custom content', () => {
      const message = createLoadingMessage({
        content: 'Fetching user information...',
        status: 'loading',
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('success state', () => {
    it('should render success state', () => {
      const message = createLoadingMessage({
        content: 'Loading...',
        status: 'success',
        resolvedContent: 'Successfully loaded!',
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should show resolved content when success', () => {
      const message = createLoadingMessage({
        content: 'Original loading message',
        status: 'success',
        resolvedContent: 'Operation completed successfully',
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should fall back to original content if no resolvedContent', () => {
      const message = createLoadingMessage({
        content: 'Loading completed',
        status: 'success',
        resolvedContent: undefined,
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('fail state', () => {
    it('should render fail state', () => {
      const message = createLoadingMessage({
        content: 'Loading...',
        status: 'fail',
        resolvedContent: 'Failed to load data',
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should show error message when failed', () => {
      const message = createLoadingMessage({
        content: 'Connecting to server...',
        status: 'fail',
        resolvedContent: 'Connection timeout',
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('with timestamp', () => {
    it('should include timestamp in all states', () => {
      const timestamp = new Date('2024-01-15T10:30:00.000Z')
      const message = createLoadingMessage({
        content: 'Loading...',
        status: 'loading',
        timestamp,
      })

      const component = wrapWithContext(<LoadingMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })
})
