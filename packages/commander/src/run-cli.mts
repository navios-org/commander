import { ConsoleLogger, createApplication, LoggerOutput } from '@navios/core'

import type {
  ApplicationOptions,
  ClassType,
  ConsoleLoggerOptions,
  TransportInstance,
} from '@navios/core'

import { cliTransport } from './transport/cli-transport.mjs'

import type { CliTransportOptions } from './transport/cli-transport.mjs'

export interface RunCliOptions extends CliTransportOptions, Omit<ApplicationOptions, 'transports'> {
  /**
   * The command line, without the executable and the script.
   * @default process.argv.slice(2)
   */
  args?: readonly string[]
  /**
   * The log: levels, an output of your own, or `false`.
   * @default ['log', 'warn', 'error', 'fatal']
   */
  logger?: ApplicationOptions['logger']
  /** Transports next to the command line, such as `scheduleTransport()`. */
  transports?: TransportInstance[]
  /**
   * The signals that interrupt the command: its `ctx.signal` aborts and the
   * application closes. A second one ends the process at once. `false`
   * leaves the signals alone.
   * @default ['SIGINT', 'SIGTERM']
   */
  signals?: NodeJS.Signals[] | false
}

const SIGNAL_CODES: Partial<Record<NodeJS.Signals, number>> = { SIGINT: 130, SIGTERM: 143 }

/**
 * Runs a command line application from start to end: builds the
 * application, runs the command the arguments name, closes the application
 * and sets the exit code of the process. Returns that code.
 *
 * ```ts
 * // cli.mts
 * import { runCli } from '@navios/commander'
 * import { AppModule } from './app.module.mjs'
 *
 * await runCli(AppModule, { name: 'mycli', version: '1.0.0' })
 * ```
 *
 * It never rejects and never calls `process.exit()`, so output that is
 * still being written is not cut off.
 */
export async function runCli(appModule: ClassType, options: RunCliOptions = {}): Promise<number> {
  const {
    args,
    signals = ['SIGINT', 'SIGTERM'],
    transports = [],
    name,
    description,
    version,
    commands,
    lazy,
    defaultCommand,
    ...applicationOptions
  } = options

  const app = createApplication(appModule, {
    // What a framework says while it starts is of no interest to someone who runs a command.
    logger: ['log', 'warn', 'error', 'fatal'],
    ...applicationOptions,
    transports: [
      cliTransport({ name, description, version, commands, lazy, defaultCommand }),
      ...transports,
    ],
  })

  let interrupted: number | undefined
  const onSignal = (signal: NodeJS.Signals) => {
    const code = SIGNAL_CODES[signal] ?? 1
    if (interrupted !== undefined) {
      // Asked twice: do not wait for the shutdown.
      process.exit(code)
    }
    interrupted = code
    app.close(signal).catch(() => {})
  }
  const listened = signals === false ? [] : signals
  for (const signal of listened) {
    process.on(signal, onSignal)
  }

  let code: number
  try {
    await app.start()
    const output = app.container.peek(LoggerOutput)
    if (output instanceof ConsoleLogger) {
      // A command line program is one short-lived process: no pid, no clock.
      // What the application set itself stays. `setDefaults` exists in core
      // 2.0.0-alpha.1 but is not in its published types, hence the cast.
      ;(
        output as ConsoleLogger & { setDefaults?: (options: ConsoleLoggerOptions) => void }
      ).setDefaults?.({
        showPid: false,
        showTimestamp: false,
        showPrefix: false,
      })
    }
    code = await app.transport(cliTransport).run(args)
  } catch (error) {
    // The application could not be built or started.
    console.error(error instanceof Error ? (error.stack ?? String(error)) : String(error))
    code = 1
  }
  try {
    await app.close()
  } catch (error) {
    console.error(error)
    code ||= 1
  }
  for (const signal of listened) {
    process.off(signal, onSignal)
  }
  code = interrupted ?? code
  process.exitCode = code
  return code
}
