export interface CliErrorOptions {
  /**
   * The exit code of the process.
   * @default 1
   */
  exitCode?: number
  cause?: unknown
}

/**
 * An error that is meant for the person at the terminal. Its message is
 * printed as it is, without a stack, and the process exits with `exitCode`.
 * Anything else a command throws is reported as a crash, with its stack.
 *
 * ```ts
 * throw new CliError('No such environment: ' + name, { exitCode: 3 })
 * ```
 */
export class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause })
    this.name = 'CliError'
    this.exitCode = options.exitCode ?? 1
  }
}

/**
 * The command line could not be understood: an unknown command or option, a
 * missing argument, a value the schema refuses. Exits with 2, and says where
 * the help is.
 */
export class CliUsageError extends CliError {
  /** The command the usage belongs to; `undefined` when none was found. */
  readonly command: string | undefined

  constructor(message: string, command?: string) {
    super(message, { exitCode: 2 })
    this.name = 'CliUsageError'
    this.command = command
  }
}
