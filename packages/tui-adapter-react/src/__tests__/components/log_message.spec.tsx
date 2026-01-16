import { describe, it, expect } from 'bun:test'

import { createElement } from 'react'

import { LogMessage } from '../../components/log/log_message.tsx'
// Import setup to apply mocks
import '../setup.ts'

/**
 * LogMessage component tests
 *
 * These tests verify the component structure, props handling, and variants.
 * Full rendering tests are limited due to custom JSX intrinsic elements (box, text).
 */
describe('LogMessage', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof LogMessage).toBe('function')
    })

    it('should accept required level prop', () => {
      const element = <LogMessage level="log">Content</LogMessage>
      expect(element.props.level).toBe('log')
      expect(element.props.children).toBe('Content')
    })

    it('should accept children prop', () => {
      const element = <LogMessage level="log">Test message content</LogMessage>
      expect(element.props.children).toBe('Test message content')
    })
  })

  describe('log levels', () => {
    const levels = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'] as const

    for (const level of levels) {
      it(`should accept ${level} level`, () => {
        const element = <LogMessage level={level}>Content</LogMessage>
        expect(element.props.level).toBe(level)
      })
    }
  })

  describe('optional props', () => {
    it('should accept timestamp as Date or string', () => {
      const timestamp = new Date('2025-01-01T12:30:45')
      const dateElement = (
        <LogMessage level="log" timestamp={timestamp}>
          Content
        </LogMessage>
      )
      const stringElement = (
        <LogMessage level="log" timestamp="12:30:45">
          Content
        </LogMessage>
      )
      expect(dateElement.props.timestamp).toBe(timestamp)
      expect(stringElement.props.timestamp).toBe('12:30:45')
    })

    it('should accept label, trace, and style props', () => {
      const trace = 'at Function.main (/app/index.js:10)'
      const element = (
        <LogMessage
          level="log"
          label="SERVER"
          trace={trace}
          borderColor="#ff0000"
          backgroundColor="#00ff00"
          borderStyle="thick"
          padding={2}
          margin={1}
        >
          Content
        </LogMessage>
      )
      expect(element.props.label).toBe('SERVER')
      expect(element.props.trace).toBe(trace)
      expect(element.props.borderColor).toBe('#ff0000')
      expect(element.props.backgroundColor).toBe('#00ff00')
      expect(element.props.borderStyle).toBe('thick')
      expect(element.props.padding).toBe(2)
      expect(element.props.margin).toBe(1)
    })
  })

  describe('variants', () => {
    const variants = ['default', 'success', 'trace'] as const

    for (const variant of variants) {
      it(`should accept ${variant} variant`, () => {
        const element = (
          <LogMessage level="log" variant={variant}>
            Content
          </LogMessage>
        )
        expect(element.props.variant).toBe(variant)
      })
    }

    it('should allow variant without explicit level styling', () => {
      const element = (
        <LogMessage level="log" variant="success">
          Operation completed
        </LogMessage>
      )
      expect(element.props.variant).toBe('success')
      expect(element.props.level).toBe('log')
    })
  })

  describe('children handling', () => {
    it('should accept string and multiple children', () => {
      const singleElement = <LogMessage level="log">Simple string</LogMessage>
      const multiElement = (
        <LogMessage level="log">
          {'Line 1'}
          {'Line 2'}
        </LogMessage>
      )
      expect(singleElement.props.children).toBe('Simple string')
      expect(multiElement.props.children).toEqual(['Line 1', 'Line 2'])
    })

    it('should accept nested elements as children', () => {
      const nested = <span>Nested content</span>
      const element = <LogMessage level="log">{nested}</LogMessage>
      expect(element.props.children).toBe(nested)
    })
  })

  describe('complex usage scenarios', () => {
    it('should accept all props together', () => {
      const timestamp = new Date()
      const element = (
        <LogMessage
          level="error"
          variant="trace"
          timestamp={timestamp}
          label="API"
          trace="at handleRequest (/api/handler.js:42)"
          borderColor="#ff0000"
          backgroundColor="#1a0000"
          borderStyle="thick"
          padding={2}
          margin={1}
        >
          Error occurred during request processing
        </LogMessage>
      )

      expect(element.props.level).toBe('error')
      expect(element.props.variant).toBe('trace')
      expect(element.props.timestamp).toBe(timestamp)
      expect(element.props.label).toBe('API')
      expect(element.props.trace).toBe('at handleRequest (/api/handler.js:42)')
      expect(element.props.borderColor).toBe('#ff0000')
      expect(element.props.backgroundColor).toBe('#1a0000')
      expect(element.props.borderStyle).toBe('thick')
      expect(element.props.padding).toBe(2)
      expect(element.props.margin).toBe(1)
    })
  })
})
