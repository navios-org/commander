import { BasicExecutionContext } from '@navios/core/transport'

import type { HandlerInfo } from '@navios/core'
import type { ContextHost } from '@navios/core/transport'

import type { CliOutput } from '../output.mjs'

export interface CommandContextInit {
  id: string
  handler: HandlerInfo
  host: ContextHost
  path: string
  args: readonly string[]
  options: unknown
  positionals: readonly string[]
  output: CliOutput
  signal: AbortSignal
}

/**
 * What a command, its guards and its interceptors know about one run. It is
 * the second argument of `execute()`.
 *
 * ```ts
 * async execute(options: Options, ctx: CommandContext) {
 *   for (const file of files) {
 *     if (ctx.signal.aborted) break // Ctrl+C
 *     ctx.output.write(`Processing ${file}`)
 *   }
 * }
 * ```
 *
 * It is an `ExecutionContext` of `@navios/core`, with `kind` `'cli'`, so a
 * guard written for any transport works for commands too.
 */
export class CommandContext<Options = unknown> extends BasicExecutionContext {
  /** The command that runs, as it was registered: `'db migrate'`. */
  readonly path: string
  /** The arguments the command was given, before they were parsed. */
  readonly args: readonly string[]
  /** The validated options: what `execute()` receives first. */
  readonly options: Options
  /** The arguments that are not options, as they were written. */
  readonly positionals: readonly string[]
  /** Where the command prints: standard output and standard error, unless replaced. */
  readonly output: CliOutput
  private readonly abortSignal: AbortSignal

  constructor(init: CommandContextInit) {
    super({ kind: 'cli', id: init.id, handler: init.handler, host: init.host })
    this.path = init.path
    this.args = init.args
    this.options = init.options as Options
    this.positionals = init.positionals
    this.output = init.output
    this.abortSignal = init.signal
  }

  /** Aborts when the application closes, which Ctrl+C makes it do under `runCli()`. */
  override get signal(): AbortSignal {
    return this.abortSignal
  }
}

/** Whether a context of any transport is that of a command. */
export function isCommandContext(ctx: { kind: string }): ctx is CommandContext {
  return ctx.kind === 'cli'
}
