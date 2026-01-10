import { describe, expect, it } from 'vitest'

import { captureTrace, formatObject } from '../../utils/format.ts'

describe('formatObject', () => {
  describe('primitives', () => {
    it('should format null', () => {
      expect(formatObject(null)).toBe('null')
    })

    it('should format undefined', () => {
      expect(formatObject(undefined)).toBe('undefined')
    })

    it('should format strings with quotes', () => {
      expect(formatObject('hello')).toBe('"hello"')
    })

    it('should format numbers', () => {
      expect(formatObject(42)).toBe('42')
      expect(formatObject(3.14)).toBe('3.14')
      expect(formatObject(-10)).toBe('-10')
    })

    it('should format booleans', () => {
      expect(formatObject(true)).toBe('true')
      expect(formatObject(false)).toBe('false')
    })
  })

  describe('special types', () => {
    it('should format Date objects as ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      expect(formatObject(date)).toBe('2024-01-15T10:30:00.000Z')
    })

    it('should format Error objects as name: message', () => {
      const error = new Error('Something went wrong')
      expect(formatObject(error)).toBe('Error: Something went wrong')
    })

    it('should format custom error types', () => {
      class CustomError extends Error {
        name = 'CustomError'
      }
      const error = new CustomError('Custom message')
      expect(formatObject(error)).toBe('CustomError: Custom message')
    })

    it('should format functions as [Function]', () => {
      const fn = () => {}
      expect(formatObject(fn)).toBe('[Function]')

      function namedFn() {}
      expect(formatObject(namedFn)).toBe('[Function]')
    })
  })

  describe('arrays', () => {
    it('should format empty arrays', () => {
      expect(formatObject([])).toBe('[]')
    })

    it('should format arrays with primitives', () => {
      const result = formatObject([1, 2, 3])
      expect(result).toContain('1')
      expect(result).toContain('2')
      expect(result).toContain('3')
    })

    it('should format nested arrays with indentation', () => {
      const result = formatObject([1, [2, 3]])
      expect(result).toContain('[')
      expect(result).toContain(']')
      // Should have nested structure
      expect(result.split('\n').length).toBeGreaterThan(1)
    })
  })

  describe('objects', () => {
    it('should format empty objects', () => {
      expect(formatObject({})).toBe('{}')
    })

    it('should format objects with properties', () => {
      const result = formatObject({ name: 'test', value: 42 })
      expect(result).toContain('name:')
      expect(result).toContain('"test"')
      expect(result).toContain('value:')
      expect(result).toContain('42')
    })

    it('should format nested objects with indentation', () => {
      const result = formatObject({
        outer: {
          inner: 'value',
        },
      })
      expect(result).toContain('outer:')
      expect(result).toContain('inner:')
      // Should have nested structure
      expect(result.split('\n').length).toBeGreaterThan(1)
    })
  })

  describe('depth limit', () => {
    it('should return [Array] for arrays at depth limit', () => {
      const deep = { level1: { level2: [1, 2, 3] } }
      const result = formatObject(deep, 2)
      expect(result).toContain('[Array]')
    })

    it('should return [Object] for objects at depth limit', () => {
      const deep = { level1: { level2: { level3: 'value' } } }
      const result = formatObject(deep, 2)
      expect(result).toContain('[Object]')
    })

    it('should use constructor name for custom objects at depth limit', () => {
      class CustomClass {
        value = 1
      }
      const deep = { level1: { level2: new CustomClass() } }
      const result = formatObject(deep, 2)
      expect(result).toContain('[CustomClass]')
    })

    it('should respect custom depth parameter', () => {
      const deep = { a: { b: { c: { d: 'value' } } } }

      // Depth 1: only see first level
      const depth1 = formatObject(deep, 1)
      expect(depth1).toContain('[Object]')

      // Depth 3: should see deeper
      const depth3 = formatObject(deep, 3)
      expect(depth3).toContain('c:')
    })
  })

  describe('mixed types', () => {
    it('should handle complex nested structures', () => {
      const complex = {
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
        metadata: {
          count: 2,
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
        },
      }

      const result = formatObject(complex, 3)
      expect(result).toContain('users:')
      expect(result).toContain('Alice')
      expect(result).toContain('metadata:')
      expect(result).toContain('count:')
    })
  })
})

describe('captureTrace', () => {
  it('should return a stack trace string', () => {
    const trace = captureTrace()
    expect(typeof trace).toBe('string')
    expect(trace.length).toBeGreaterThan(0)
  })

  it('should filter internal frames (skip first 4 lines)', () => {
    const trace = captureTrace()
    // The trace should not contain "captureTrace" in the first visible line
    // since it filters out internal frames
    const lines = trace.split('\n')
    // First line should be the caller, not captureTrace itself
    expect(lines[0]).not.toContain('captureTrace')
  })
})
