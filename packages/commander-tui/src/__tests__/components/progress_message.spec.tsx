import { describe, expect, it } from 'vitest'

import { ProgressMessage } from '../../adapters/react/components/screen/progress_message.tsx'
import { createProgressMessage } from '../utils/factories.ts'
import { wrapWithContext } from '../utils/render-utils.tsx'

describe('ProgressMessage', () => {
  describe('progress percentages', () => {
    it('should render progress at 0%', () => {
      const message = createProgressMessage({
        label: 'Processing',
        current: 0,
        total: 100,
        status: 'active',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should render progress at 50%', () => {
      const message = createProgressMessage({
        label: 'Downloading files',
        current: 50,
        total: 100,
        status: 'active',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should render progress at 100%', () => {
      const message = createProgressMessage({
        label: 'Upload complete',
        current: 100,
        total: 100,
        status: 'active',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should render progress at arbitrary percentage', () => {
      const message = createProgressMessage({
        label: 'Installing packages',
        current: 37,
        total: 100,
        status: 'active',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should handle non-100 totals', () => {
      const message = createProgressMessage({
        label: 'Processing items',
        current: 3,
        total: 10,
        status: 'active',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('with label', () => {
    it('should render with label', () => {
      const message = createProgressMessage({
        label: 'Custom Label',
        current: 25,
        total: 100,
        status: 'active',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('complete state', () => {
    it('should render complete state', () => {
      const message = createProgressMessage({
        label: 'Processing',
        current: 100,
        total: 100,
        status: 'complete',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should show resolved content when complete', () => {
      const message = createProgressMessage({
        label: 'Processing',
        current: 100,
        total: 100,
        status: 'complete',
        resolvedContent: 'All items processed successfully!',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('failed state', () => {
    it('should render failed state', () => {
      const message = createProgressMessage({
        label: 'Uploading',
        current: 42,
        total: 100,
        status: 'failed',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })

    it('should show error content when failed', () => {
      const message = createProgressMessage({
        label: 'Uploading',
        current: 42,
        total: 100,
        status: 'failed',
        resolvedContent: 'Network error: connection lost',
      })

      const component = wrapWithContext(<ProgressMessage message={message} />)

      expect(component).toMatchSnapshot()
    })
  })
})
