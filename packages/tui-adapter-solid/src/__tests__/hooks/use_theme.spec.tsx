import { describe, it, expect } from 'bun:test'

import { darkTheme, lightTheme, highContrastTheme } from '@navios/commander-tui'
import { createRoot } from 'solid-js'

import { LoggerProvider } from '../../context/logger_context'
import { useTheme } from '../../hooks/use_theme'

describe('useTheme', () => {
  describe('default theme', () => {
    it('should return dark theme by default', () => {
      createRoot((dispose) => {
        let theme: ReturnType<typeof useTheme> | undefined

        ;<LoggerProvider>
          {(() => {
            theme = useTheme()
            return null
          })()}
        </LoggerProvider>

        expect(theme!.name).toBe('dark')

        dispose()
      })
    })

    it('should return full theme object', () => {
      createRoot((dispose) => {
        let theme: ReturnType<typeof useTheme> | undefined

        ;<LoggerProvider>
          {(() => {
            theme = useTheme()
            return null
          })()}
        </LoggerProvider>

        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('logLevels')
        expect(theme).toHaveProperty('sidebar')

        dispose()
      })
    })
  })

  describe('theme presets', () => {
    it('should return dark theme for "dark" preset', () => {
      createRoot((dispose) => {
        let theme: ReturnType<typeof useTheme> | undefined

        ;<LoggerProvider theme="dark">
          {(() => {
            theme = useTheme()
            return null
          })()}
        </LoggerProvider>

        expect(theme!.name).toBe('dark')
        expect(theme!.logLevels).toEqual(darkTheme.logLevels)

        dispose()
      })
    })

    it('should return light theme for "light" preset', () => {
      createRoot((dispose) => {
        let theme: ReturnType<typeof useTheme> | undefined

        ;<LoggerProvider theme="light">
          {(() => {
            theme = useTheme()
            return null
          })()}
        </LoggerProvider>

        expect(theme!.name).toBe('light')
        expect(theme!.logLevels).toEqual(lightTheme.logLevels)

        dispose()
      })
    })

    it('should return high-contrast theme for "high-contrast" preset', () => {
      createRoot((dispose) => {
        let theme: ReturnType<typeof useTheme> | undefined

        ;<LoggerProvider theme="high-contrast">
          {(() => {
            theme = useTheme()
            return null
          })()}
        </LoggerProvider>

        expect(theme!.name).toBe('high-contrast')
        expect(theme!.logLevels).toEqual(highContrastTheme.logLevels)

        dispose()
      })
    })
  })

  describe('custom theme', () => {
    it('should return custom theme when provided', () => {
      createRoot((dispose) => {
        let theme: ReturnType<typeof useTheme> | undefined

        const customTheme = {
          ...darkTheme,
          name: 'my-custom-theme',
        }

        ;<LoggerProvider theme={customTheme}>
          {(() => {
            theme = useTheme()
            return null
          })()}
        </LoggerProvider>

        expect(theme!.name).toBe('my-custom-theme')

        dispose()
      })
    })
  })

  describe('outside LoggerProvider', () => {
    it('should return dark theme as fallback', () => {
      createRoot((dispose) => {
        const theme = useTheme()

        expect(theme).toBe(darkTheme)

        dispose()
      })
    })
  })
})
