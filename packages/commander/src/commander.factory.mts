import { ConsoleLogger, NaviosFactory } from '@navios/core'

import type { ClassTypeWithInstance, LogLevel, NaviosApplication, NaviosModule } from '@navios/core'

import { defineCliEnvironment } from './define-environment.mjs'
import { dynamicImport } from './utils/index.mjs'

import type { CliEnvironment } from './interfaces/environment.interface.mjs'

/**
 * Logger display options for CLI applications.
 * All options default to false for cleaner CLI output.
 *
 * @public
 */
export interface CommanderLoggerOptions {
  /**
   * Enabled log levels.
   * @default ['log', 'error', 'warn', 'debug', 'verbose', 'fatal']
   */
  logLevels?: LogLevel[]
  /**
   * If true, will print the process ID in the log message.
   * @default false
   */
  showPid?: boolean
  /**
   * If true, will print the log level in the log message.
   * @default true
   */
  showLogLevel?: boolean
  /**
   * If true, will print the prefix/app name in the log message.
   * @default false
   */
  showPrefix?: boolean
  /**
   * If true, will print the context in the log message.
   * @default true
   */
  showContext?: boolean
  /**
   * If true, will print the absolute timestamp in the log message.
   * @default false
   */
  showTimestamp?: boolean
  /**
   * If enabled, will print timestamp difference between current and previous log message.
   * @default false
   */
  showTimeDiff?: boolean
}

/**
 * TUI-specific options for terminal UI mode.
 * Only used when enableTUI is true.
 *
 * @public
 */
export interface CommanderTuiOptions {
  /**
   * Exit on Ctrl+C.
   * @default true
   */
  exitOnCtrlC?: boolean
  /**
   * Adapter to use for the TUI.
   * @default 'none'
   */
  adapter?: 'react' | 'solid' | 'ink' | 'none'
  /**
   * Sidebar width in columns.
   */
  sidebarWidth?: number
  /**
   * Sidebar position.
   */
  sidebarPosition?: 'left' | 'right'
  /**
   * Sidebar header title.
   */
  sidebarTitle?: string
  /**
   * Auto close after all screens complete successfully.
   * Set to true for default delay (5000ms), or specify delay in milliseconds.
   */
  autoClose?: boolean | number
  /**
   * Theme preset name ('dark', 'light', 'high-contrast') or custom theme object.
   */
  theme?: string | Record<string, unknown>
  /**
   * Enable mouse support.
   * @default false
   */
  useMouse?: boolean
  /**
   * Hide the default console logger screen from the sidebar.
   * @default false
   */
  hideDefaultScreen?: boolean
  /**
   * Use OpenTUI for terminal rendering.
   * When true: Full TUI with sidebar, scrolling, interactive prompts.
   * When false: Stdout mode - static screens print immediately, others on completion.
   * @default true for Node.js, false for Bun (OpenTUI not supported)
   */
  useOpenTUI?: boolean
}

/**
 * Configuration options for CommanderFactory.
 *
 * @public
 */
export interface CommanderFactoryOptions {
  /**
   * Enabled log levels.
   * @default ['log', 'error', 'warn', 'debug', 'verbose', 'fatal']
   */
  logLevels?: LogLevel[]
  /**
   * Logger display options. These override the default CLI-friendly logger settings.
   * Ignored when enableTUI is true.
   */
  logger?: CommanderLoggerOptions
  /**
   * Enable TUI mode with @navios/commander-tui.
   * Requires @navios/commander-tui to be installed.
   */
  enableTUI?: boolean
  /**
   * TUI-specific options. Only used when enableTUI is true.
   */
  tuiOptions?: CommanderTuiOptions
}

/**
 * Factory class for creating CLI applications.
 *
 * This is a convenience wrapper around `NaviosFactory.create()` that
 * configures everything needed for CLI usage. It sets up the CLI adapter
 * and returns a typed `NaviosApplication<CliEnvironment>`.
 *
 * @example
 * ```typescript
 * import { CommanderFactory } from '@navios/commander'
 * import { AppModule } from './app.module'
 *
 * async function bootstrap() {
 *   const app = await CommanderFactory.create(AppModule)
 *   await app.init()
 *
 *   const adapter = app.getAdapter()
 *   await adapter.run(process.argv)
 *
 *   await app.close()
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Alternative: use NaviosFactory directly
 * import { NaviosFactory } from '@navios/core'
 * import { defineCliEnvironment, type CliEnvironment } from '@navios/commander'
 *
 * const app = await NaviosFactory.create<CliEnvironment>(AppModule, {
 *   adapter: defineCliEnvironment(),
 * })
 * ```
 */
export class CommanderFactory {
  /**
   * Creates a new CLI application instance configured with the provided module.
   *
   * @param appModule - The root CLI module class decorated with `@CliModule`
   * @param options - Optional configuration options for the CLI application
   * @returns A promise that resolves to a configured NaviosApplication instance
   *
   * @example
   * ```typescript
   * const app = await CommanderFactory.create(AppModule)
   * await app.init()
   *
   * const adapter = app.getAdapter()
   * await adapter.run(process.argv)
   * ```
   */
  static async create<TModule extends NaviosModule = NaviosModule>(
    appModule: ClassTypeWithInstance<TModule>,
    options: CommanderFactoryOptions = {},
  ): Promise<NaviosApplication<CliEnvironment>> {
    if (options.enableTUI) {
      // Dynamic import to keep commander-tui as optional peer dependency
      let tuiModule: typeof import('@navios/commander-tui')
      try {
        // Dynamic imports using Function constructor to bypass bundler static analysis
        tuiModule =
          await dynamicImport<typeof import('@navios/commander-tui')>('@navios/commander-tui')
        // Load the appropriate adapter based on configuration
        const adapter = options.tuiOptions?.adapter
        const isBun = tuiModule.isBunRuntime()

        if (adapter === 'ink') {
          await dynamicImport('@navios/tui-adapter-ink')
        } else if (adapter === 'solid' && isBun) {
          await dynamicImport('@navios/tui-adapter-solid')
        } else if (adapter === 'react' && isBun) {
          await dynamicImport('@navios/tui-adapter-react')
        }
      } catch (error) {
        console.error(error)
        throw new Error(
          'TUI mode requires @navios/commander-tui package. ' +
            'Install it with: npm install @navios/commander-tui',
        )
      }

      const { overrideConsoleLogger, ScreenManager } = tuiModule

      // Override the ConsoleLogger service to use the ScreenLogger service instead of the default ConsoleLogger service.
      overrideConsoleLogger(options.tuiOptions?.hideDefaultScreen ?? false)

      if (options.tuiOptions?.hideDefaultScreen) {
        // Import the help command override to ensure it is registered
        await import('./overrides/help.command.mjs')
      }
      // Create app without custom logger - TUI override handles it
      const app = await NaviosFactory.create<CliEnvironment>(appModule, {
        adapter: defineCliEnvironment(),
        logger: options.logLevels,
      })

      // Get screen manager and bind TUI before returning
      const screenManager = await app.get(ScreenManager)
      screenManager.setup({
        logLevels: options.logLevels,
      })
      await screenManager.bind({
        exitOnCtrlC: options.tuiOptions?.exitOnCtrlC,
        sidebarWidth: options.tuiOptions?.sidebarWidth,
        sidebarPosition: options.tuiOptions?.sidebarPosition,
        sidebarTitle: options.tuiOptions?.sidebarTitle,
        autoClose: options.tuiOptions?.autoClose,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: options.tuiOptions?.theme as any,
        useMouse: options.tuiOptions?.useMouse,
        useOpenTUI: options.tuiOptions?.useOpenTUI || options.tuiOptions?.adapter === 'ink',
      })

      return app
    }

    // Standard (non-TUI) mode - existing behavior unchanged
    const app = await NaviosFactory.create<CliEnvironment>(appModule, {
      adapter: defineCliEnvironment(),
      logger: ConsoleLogger.create({
        logLevels: options.logger?.logLevels,
        showTimeDiff: options.logger?.showTimeDiff ?? false,
        showPid: options.logger?.showPid ?? false,
        showLogLevel: options.logger?.showLogLevel ?? true,
        showPrefix: options.logger?.showPrefix ?? false,
        showContext: options.logger?.showContext ?? true,
        showTimestamp: options.logger?.showTimestamp ?? false,
      }),
    })

    return app
  }
}
