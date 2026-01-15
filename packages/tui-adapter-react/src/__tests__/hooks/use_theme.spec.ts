import { describe, it, expect } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'

import { darkTheme, lightTheme, highContrastTheme } from '@navios/commander-tui'
import { LoggerProvider } from '../../context/logger_context'
import { useTheme } from '../../hooks/use_theme'

// Import setup
import '../setup.ts'

// Helper to render hooks within LoggerProvider
function renderThemeHook(theme?: Parameters<typeof LoggerProvider>[0]['theme']) {
  return renderHook(() => useTheme(), {
    wrapper: ({ children }) => createElement(LoggerProvider, { theme, children }),
  })
}

describe('useTheme', () => {
  describe('default theme', () => {
    it('should return dark theme by default', () => {
      const { result } = renderThemeHook()

      expect(result.current.name).toBe('dark')
    })

    it('should return full theme object', () => {
      const { result } = renderThemeHook()

      expect(result.current).toHaveProperty('name')
      expect(result.current).toHaveProperty('logLevels')
      expect(result.current).toHaveProperty('sidebar')
    })
  })

  describe('theme presets', () => {
    it('should return dark theme for "dark" preset', () => {
      const { result } = renderThemeHook('dark')

      expect(result.current.name).toBe('dark')
      expect(result.current.logLevels).toEqual(darkTheme.logLevels)
    })

    it('should return light theme for "light" preset', () => {
      const { result } = renderThemeHook('light')

      expect(result.current.name).toBe('light')
      expect(result.current.logLevels).toEqual(lightTheme.logLevels)
    })

    it('should return high-contrast theme for "high-contrast" preset', () => {
      const { result } = renderThemeHook('high-contrast')

      expect(result.current.name).toBe('high-contrast')
      expect(result.current.logLevels).toEqual(highContrastTheme.logLevels)
    })
  })

  describe('custom theme', () => {
    it('should return custom theme when provided', () => {
      const customTheme = {
        ...darkTheme,
        name: 'my-custom-theme',
      }

      const { result } = renderThemeHook(customTheme)

      expect(result.current.name).toBe('my-custom-theme')
    })
  })

  describe('outside LoggerProvider', () => {
    it('should return dark theme as fallback', () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current).toBe(darkTheme)
    })
  })
})
