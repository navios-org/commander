import { definePlugin, inject, InjectionToken, LoggerOutput } from '@navios/core'

import type { LoggerService, LogLevel } from '@navios/core'

import { Adapter, ScreenLogger, ScreenManager } from './tokens/index.ts'

import type { TuiAdapter } from './adapters/interface.ts'
import type { ScreenLoggerInstance } from './services/logger.ts'
import type { ScreenManagerInstance } from './services/screen_manager.ts'
import type { BindOptions } from './types/index.ts'

export interface TuiLogScreenOptions {
  /** @default 'Log' */
  name?: string
  icon?: string
  /**
   * Keep the screen out of the sidebar. It is shown when something is
   * logged as an error.
   * @default false
   */
  hidden?: boolean
}

export interface TuiOptions extends BindOptions {
  /**
   * What draws the screens: `inkAdapter()` of `@navios/tui-adapter-ink`, or
   * `openTuiAdapter()` of `@navios/tui-adapter-react`. Without one the
   * screens print to standard output and prompts are asked with readline.
   */
  adapter?: TuiAdapter
  /** The levels that are shown at all, on every screen. */
  logLevels?: LogLevel[]
  /**
   * The screen that the log of the application goes to: everything written
   * with `Logger` of `@navios/core`. `false` leaves the log where it was.
   */
  logScreen?: TuiLogScreenOptions | false
}

const TuiLogScreen = InjectionToken.create<Required<TuiLogScreenOptions>>('TuiLogScreen')

/** Sends the application's log to a screen. */
class ScreenLoggerOutput implements LoggerService {
  private readonly options = inject(TuiLogScreen)
  private readonly logger: ScreenLoggerInstance = inject(ScreenLogger, {
    screen: {
      name: this.options.name,
      icon: this.options.icon,
      hidden: this.options.hidden,
      static: true,
    },
  })

  private write(
    level: 'log' | 'warn' | 'debug' | 'verbose' | 'error' | 'fatal',
    message: unknown,
    params: unknown[],
  ): void {
    // The last parameter is the context the logger was injected with.
    const context = typeof params.at(-1) === 'string' ? (params.at(-1) as string) : undefined
    const details = context === undefined ? params : params.slice(0, -1)
    const text = [message, ...details.filter((detail) => detail !== undefined)]
      .map((part) =>
        part instanceof Error ? (part.stack ?? part.message) : (part as string | object),
      )
      .map((part) => (typeof part === 'string' ? part : JSON.stringify(part)))
      .join(' ')
    this.logger[level](text, context)
  }

  log(message: unknown, ...params: unknown[]): void {
    this.write('log', message, params)
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.write('warn', message, params)
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.write('debug', message, params)
  }

  verbose(message: unknown, ...params: unknown[]): void {
    this.write('verbose', message, params)
  }

  error(message: unknown, ...params: unknown[]): void {
    this.reveal()
    this.write('error', message, params)
  }

  fatal(message: unknown, ...params: unknown[]): void {
    this.reveal()
    this.write('fatal', message, params)
  }

  setLogLevels(levels: LogLevel[]): void {
    this.logger.setLogLevels(levels)
  }

  /** An error on a screen nobody sees would be lost. */
  private reveal(): void {
    if (this.options.hidden) {
      this.logger.getScreen().show()
    }
  }
}

/**
 * Shows the application in a terminal interface: a screen per task, with
 * logs, progress and prompts, and the application's own log on a screen of
 * its own.
 *
 * ```ts
 * import { runCli } from '@navios/commander'
 * import { tui } from '@navios/commander-tui'
 * import { inkAdapter } from '@navios/tui-adapter-ink'
 *
 * await runCli(AppModule, {
 *   plugins: [tui({ adapter: inkAdapter(), sidebar: { title: 'My CLI' }, autoClose: true })],
 * })
 * ```
 *
 * The interface opens when the application has started and closes with it.
 * Where there is no terminal, as in CI, the screens print to standard output.
 */
export const tui = definePlugin<TuiOptions | void>({
  name: 'tui',
  setup(api, options) {
    const { adapter, logLevels, logScreen = {}, ...bindOptions } = options ?? {}
    if (adapter) {
      api.provide(Adapter, { value: adapter })
    }
    if (logScreen !== false) {
      api.provide(TuiLogScreen, {
        value: {
          name: logScreen.name ?? 'Log',
          icon: logScreen.icon ?? '💻',
          hidden: logScreen.hidden ?? false,
        },
      })
      api.provide(LoggerOutput, { class: ScreenLoggerOutput })
    }

    let manager: ScreenManagerInstance | null = null
    api.onBootstrap(async () => {
      manager = await api.container.get(ScreenManager)
      manager.setup({ theme: bindOptions.theme, logLevels })
      await manager.bind(bindOptions)
    })
    api.onShutdown(async () => {
      await manager?.unbind()
    })
  },
})
