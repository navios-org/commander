import { describe, it, expect } from 'bun:test'

import { darkTheme, lightTheme, highContrastTheme } from '@navios/commander-tui'
import { createRoot } from 'solid-js'

import { LoggerProvider, useLoggerContext } from '../../context/logger_context'

describe('LoggerProvider', () => {
  describe('default theme', () => {
    it('should provide dark theme by default', () => {
      createRoot((dispose) => {
        let context: ReturnType<typeof useLoggerContext> | undefined

        ;<LoggerProvider>
          {(() => {
            context = useLoggerContext()
            return null
          })()}
        </LoggerProvider>

        expect(context!.theme.name).toBe('dark')
        expect(context!.levelColors).toBeDefined()

        dispose()
      })
    })

    it('should provide level colors from dark theme', () => {
      createRoot((dispose) => {
        let context: ReturnType<typeof useLoggerContext> | undefined

        ;<LoggerProvider>
          {(() => {
            context = useLoggerContext()
            return null
          })()}
        </LoggerProvider>

        expect(context!.levelColors).toEqual(darkTheme.logLevels)

        dispose()
      })
    })
  })

  describe('theme presets', () => {
    it('should resolve "dark" preset', () => {
      createRoot((dispose) => {
        let context: ReturnType<typeof useLoggerContext> | undefined

        ;<LoggerProvider theme="dark">
          {(() => {
            context = useLoggerContext()
            return null
          })()}
        </LoggerProvider>

        expect(context!.theme.name).toBe('dark')

        dispose()
      })
    })

    it('should resolve "light" preset', () => {
      createRoot((dispose) => {
        let context: ReturnType<typeof useLoggerContext> | undefined

        ;<LoggerProvider theme="light">
          {(() => {
            context = useLoggerContext()
            return null
          })()}
        </LoggerProvider>

        expect(context!.theme.name).toBe('light')

        dispose()
      })
    })

    it('should resolve "high-contrast" preset', () => {
      createRoot((dispose) => {
        let context: ReturnType<typeof useLoggerContext> | undefined

        ;<LoggerProvider theme="high-contrast">
          {(() => {
            context = useLoggerContext()
            return null
          })()}
        </LoggerProvider>

        expect(context!.theme.name).toBe('high-contrast')

        dispose()
      })
    })
  })

  describe('custom theme', () => {
    it('should accept custom theme object', () => {
      createRoot((dispose) => {
        let context: ReturnType<typeof useLoggerContext> | undefined

        const customTheme = {
          ...darkTheme,
          name: 'custom',
        }

        ;<LoggerProvider theme={customTheme}>
          {(() => {
            context = useLoggerContext()
            return null
          })()}
        </LoggerProvider>

        expect(context!.theme.name).toBe('custom')

        dispose()
      })
    })
  })

  describe('levelColors override', () => {
    it('should allow custom levelColors to override theme', () => {
      createRoot((dispose) => {
        let context: ReturnType<typeof useLoggerContext> | undefined

        const customLevelColors = {
          log: '#ff0000',
        }

        ;<LoggerProvider theme="dark" levelColors={customLevelColors}>
          {(() => {
            context = useLoggerContext()
            return null
          })()}
        </LoggerProvider>

        expect(context!.levelColors.log).toBe('#ff0000')
        // Other levels should come from theme
        expect(context!.levelColors.error).toBe(darkTheme.logLevels.error)

        dispose()
      })
    })
  })
})

describe('useLoggerContext', () => {
  it('should return defaults when used outside LoggerProvider', () => {
    createRoot((dispose) => {
      const context = useLoggerContext()

      // Should return dark theme defaults
      expect(context.theme).toBe(darkTheme)
      expect(context.levelColors).toEqual(darkTheme.logLevels)
      expect(context.syntaxStyle).toBeUndefined()
      expect(context.treeSitterClient).toBeUndefined()

      dispose()
    })
  })

  it('should return context values when used inside LoggerProvider', () => {
    createRoot((dispose) => {
      let context: ReturnType<typeof useLoggerContext> | undefined

      ;<LoggerProvider>
        {(() => {
          context = useLoggerContext()
          return null
        })()}
      </LoggerProvider>

      expect(context!.theme).toBeDefined()
      expect(context!.levelColors).toBeDefined()
      expect(context!.syntaxStyle).toBeDefined()

      dispose()
    })
  })
})
