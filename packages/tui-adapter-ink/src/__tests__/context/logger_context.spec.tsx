import { darkTheme, lightTheme, highContrastTheme } from '@navios/commander-tui'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, it, expect } from 'vitest'

import { LoggerProvider, useLoggerContext } from '../../context/logger_context.tsx'

describe('LoggerProvider', () => {
  describe('theme resolution', () => {
    it('should resolve dark theme from preset name', () => {
      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) => createElement(LoggerProvider, { theme: 'dark' }, children),
      })

      expect(result.current.theme.name).toBe('dark')
    })

    it('should resolve light theme from preset name', () => {
      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) => createElement(LoggerProvider, { theme: 'light' }, children),
      })

      expect(result.current.theme.name).toBe('light')
    })

    it('should resolve high-contrast theme from preset name', () => {
      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) =>
          createElement(LoggerProvider, { theme: 'high-contrast' }, children),
      })

      expect(result.current.theme.name).toBe('high-contrast')
    })

    it('should use provided Theme object directly', () => {
      const customTheme = { ...darkTheme, name: 'My Custom Theme' }

      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) => createElement(LoggerProvider, { theme: customTheme }, children),
      })

      expect(result.current.theme.name).toBe('My Custom Theme')
    })

    it('should default to dark theme when no theme provided', () => {
      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) => createElement(LoggerProvider, null, children),
      })

      expect(result.current.theme.name).toBe('dark')
    })
  })

  describe('levelColors', () => {
    it('should derive levelColors from theme', () => {
      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) => createElement(LoggerProvider, { theme: 'dark' }, children),
      })

      expect(result.current.levelColors).toBeDefined()
      expect(result.current.levelColors).toEqual(darkTheme.logLevels)
    })

    it('should allow custom levelColors to override theme', () => {
      const customLevelColors = { log: '#ff0000' }

      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) =>
          createElement(
            LoggerProvider,
            { theme: 'dark', levelColors: customLevelColors },
            children,
          ),
      })

      expect(result.current.levelColors.log).toBe('#ff0000')
      // Other levels should still come from theme
      expect(result.current.levelColors.error).toBe(darkTheme.logLevels.error)
    })
  })

  describe('syntaxStyle and treeSitterClient', () => {
    it('should return undefined for syntaxStyle (Ink uses different highlighting)', () => {
      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) => createElement(LoggerProvider, null, children),
      })

      expect(result.current.syntaxStyle).toBeUndefined()
    })

    it('should return undefined for treeSitterClient', () => {
      const { result } = renderHook(() => useLoggerContext(), {
        wrapper: ({ children }) => createElement(LoggerProvider, null, children),
      })

      expect(result.current.treeSitterClient).toBeUndefined()
    })
  })
})

describe('useLoggerContext', () => {
  it('should return defaults when used outside LoggerProvider', () => {
    const { result } = renderHook(() => useLoggerContext())

    expect(result.current).toBeDefined()
    expect(result.current.theme).toEqual(darkTheme)
    expect(result.current.levelColors).toEqual(darkTheme.logLevels)
    expect(result.current.syntaxStyle).toBeUndefined()
    expect(result.current.treeSitterClient).toBeUndefined()
  })

  it('should return context value when used inside LoggerProvider', () => {
    const { result } = renderHook(() => useLoggerContext(), {
      wrapper: ({ children }) => createElement(LoggerProvider, { theme: 'light' }, children),
    })

    expect(result.current.theme).toEqual(lightTheme)
    expect(result.current.levelColors).toEqual(lightTheme.logLevels)
  })
})
