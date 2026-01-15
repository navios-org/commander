import { describe, it, expect } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'

import { darkTheme, lightTheme, highContrastTheme } from '@navios/commander-tui'
import { LoggerProvider, useLoggerContext } from '../../context/logger_context'

// Import setup
import '../setup.ts'

// Helper to render hooks within LoggerProvider
function renderLoggerHook<T>(hook: () => T, props: Parameters<typeof LoggerProvider>[0] = { children: null }) {
  return renderHook(hook, {
    wrapper: ({ children }) => createElement(LoggerProvider, { ...props, children }),
  })
}

describe('LoggerProvider', () => {
  describe('default theme', () => {
    it('should provide dark theme by default', () => {
      const { result } = renderLoggerHook(() => useLoggerContext())

      expect(result.current.theme.name).toBe('dark')
      expect(result.current.levelColors).toBeDefined()
    })

    it('should provide level colors from dark theme', () => {
      const { result } = renderLoggerHook(() => useLoggerContext())

      expect(result.current.levelColors).toEqual(darkTheme.logLevels)
    })
  })

  describe('theme presets', () => {
    it('should resolve "dark" preset', () => {
      const { result } = renderLoggerHook(() => useLoggerContext(), {
        theme: 'dark',
        children: null,
      })

      expect(result.current.theme.name).toBe('dark')
    })

    it('should resolve "light" preset', () => {
      const { result } = renderLoggerHook(() => useLoggerContext(), {
        theme: 'light',
        children: null,
      })

      expect(result.current.theme.name).toBe('light')
    })

    it('should resolve "high-contrast" preset', () => {
      const { result } = renderLoggerHook(() => useLoggerContext(), {
        theme: 'high-contrast',
        children: null,
      })

      expect(result.current.theme.name).toBe('high-contrast')
    })
  })

  describe('custom theme', () => {
    it('should accept custom theme object', () => {
      const customTheme = {
        ...darkTheme,
        name: 'custom',
      }

      const { result } = renderLoggerHook(() => useLoggerContext(), {
        theme: customTheme,
        children: null,
      })

      expect(result.current.theme.name).toBe('custom')
    })
  })

  describe('levelColors override', () => {
    it('should allow custom levelColors to override theme', () => {
      const customLevelColors = {
        log: '#ff0000',
      }

      const { result } = renderLoggerHook(() => useLoggerContext(), {
        theme: 'dark',
        levelColors: customLevelColors,
        children: null,
      })

      expect(result.current.levelColors.log).toBe('#ff0000')
      // Other levels should come from theme
      expect(result.current.levelColors.error).toBe(darkTheme.logLevels.error)
    })
  })
})

describe('useLoggerContext', () => {
  it('should return defaults when used outside LoggerProvider', () => {
    const { result } = renderHook(() => useLoggerContext())

    // Should return dark theme defaults
    expect(result.current.theme).toBe(darkTheme)
    expect(result.current.levelColors).toEqual(darkTheme.logLevels)
    expect(result.current.syntaxStyle).toBeUndefined()
    expect(result.current.treeSitterClient).toBeUndefined()
  })

  it('should return context values when used inside LoggerProvider', () => {
    const { result } = renderLoggerHook(() => useLoggerContext())

    expect(result.current.theme).toBeDefined()
    expect(result.current.levelColors).toBeDefined()
    expect(result.current.syntaxStyle).toBeDefined()
  })
})
