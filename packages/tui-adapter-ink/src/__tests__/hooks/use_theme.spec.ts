import { darkTheme } from '@navios/commander-tui'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, it, expect } from 'vitest'

import { LoggerProvider } from '../../context/logger_context.tsx'
import { useTheme } from '../../hooks/use_theme.ts'

describe('useTheme', () => {
  it('should return default dark theme when used outside LoggerProvider', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current).toBeDefined()
    expect(result.current.name).toBe(darkTheme.name)
  })

  it('should return theme from LoggerProvider', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => createElement(LoggerProvider, { theme: 'dark' }, children),
    })

    expect(result.current).toBeDefined()
    expect(result.current.name).toBe('dark')
  })

  it('should return light theme when LoggerProvider uses light preset', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => createElement(LoggerProvider, { theme: 'light' }, children),
    })

    expect(result.current).toBeDefined()
    expect(result.current.name).toBe('light')
  })

  it('should return high-contrast theme when LoggerProvider uses high-contrast preset', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) =>
        createElement(LoggerProvider, { theme: 'high-contrast' }, children),
    })

    expect(result.current).toBeDefined()
    expect(result.current.name).toBe('high-contrast')
  })

  it('should return custom theme when provided', () => {
    const customTheme = {
      ...darkTheme,
      name: 'Custom Theme',
    }

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => createElement(LoggerProvider, { theme: customTheme }, children),
    })

    expect(result.current.name).toBe('Custom Theme')
  })
})
