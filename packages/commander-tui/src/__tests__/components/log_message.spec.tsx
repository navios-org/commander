import { describe, expect, it } from 'vitest'

import { LogMessage } from '../../components/log/log_message.tsx'
import { wrapWithContext } from '../utils/render-utils.tsx'

import type { LogLevel } from '@navios/core'

describe('LogMessage', () => {
  const LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']

  describe('renders log levels', () => {
    for (const level of LOG_LEVELS) {
      it(`should render ${level} level`, () => {
        const component = wrapWithContext(<LogMessage level={level}>Test message</LogMessage>)

        expect(component).toMatchSnapshot()
      })
    }
  })

  describe('variants', () => {
    it('should render with success variant', () => {
      const component = wrapWithContext(
        <LogMessage level="log" variant="success">
          Success message
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with trace variant', () => {
      const component = wrapWithContext(
        <LogMessage level="verbose" variant="trace">
          Trace message
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('with timestamp', () => {
    it('should render with Date timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:00.000Z')
      const component = wrapWithContext(
        <LogMessage level="log" timestamp={timestamp}>
          Message with timestamp
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with string timestamp', () => {
      const component = wrapWithContext(
        <LogMessage level="log" timestamp="10:30:00">
          Message with string timestamp
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('with label', () => {
    it('should render with label', () => {
      const component = wrapWithContext(
        <LogMessage level="log" label="API">
          Message with label
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with label and timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:00.000Z')
      const component = wrapWithContext(
        <LogMessage level="log" label="Database" timestamp={timestamp}>
          Message with both
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('with trace content', () => {
    it('should render with trace', () => {
      const component = wrapWithContext(
        <LogMessage level="verbose" trace="    at someFunction (file.ts:10:5)\n    at main (index.ts:1:1)">
          Message with trace
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('with custom colors', () => {
    it('should render with custom borderColor', () => {
      const component = wrapWithContext(
        <LogMessage level="log" borderColor="#ff0000">
          Custom border color
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with custom backgroundColor', () => {
      const component = wrapWithContext(
        <LogMessage level="log" backgroundColor="#111111">
          Custom background color
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('border styles', () => {
    it('should render with thin border style (default)', () => {
      const component = wrapWithContext(
        <LogMessage level="log" borderStyle="thin">
          Thin border
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with thick border style', () => {
      const component = wrapWithContext(
        <LogMessage level="log" borderStyle="thick">
          Thick border
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('with padding and margin', () => {
    it('should render with custom padding', () => {
      const component = wrapWithContext(
        <LogMessage level="log" padding={2}>
          Custom padding
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with custom margin', () => {
      const component = wrapWithContext(
        <LogMessage level="log" margin={1}>
          Custom margin
        </LogMessage>,
      )

      expect(component).toMatchSnapshot()
    })
  })
})
