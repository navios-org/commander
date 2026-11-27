import { basename } from 'node:path'

import { defineTransport, executeChain, moduleClasses, needsScope } from '@navios/core/transport'

import type { ClassType, Transport } from '@navios/core'
import type { ModuleNode, TransportHost } from '@navios/core/transport'

import { CommandContext } from '../command/command-context.mjs'
import { getCommandMetadata, isCommand } from '../command/command-metadata.mjs'
import { CliError, CliUsageError } from '../errors.mjs'
import { renderCommandHelp, renderCommandList } from '../help/render-help.mjs'
import { CliOutput } from '../output.mjs'
import { parseCommandPath } from '../parser/command-path.mjs'
import { assignParams, compileArgsSpec, parseArgs } from '../parser/parse-args.mjs'
import { describeSchema } from '../parser/schema-spec.mjs'
import { closest } from '../parser/suggest.mjs'

import type { CommandMetadata } from '../command/command-metadata.mjs'
import type { CommandHandler, CommandResult } from '../command/command.mjs'
import type { CommandSummary, ProgramInfo } from '../help/render-help.mjs'
import type { ArgsSpec } from '../parser/parse-args.mjs'

import { commandChain } from './chain.mjs'
import { validateOptions } from './validate.mjs'

import type { CommandChain } from './chain.mjs'

declare module '@navios/core' {
  interface ModuleOptions {
    /** `@Command()` classes that `cliTransport()` runs. */
    commands?: ClassType[]
  }
}

type Loaded = ClassType | { default: ClassType }

/**
 * A command whose code is imported only when it runs or its help is asked
 * for. The path and the description are repeated here, so that command
 * lists need not load it.
 */
export interface LazyCommand {
  /** The path of the command, exactly as its `@Command` declares it. */
  path: string
  description?: string
  aliases?: string[]
  hidden?: boolean
  /** Imports the class: `() => import('./deploy.command.mjs')` when it is the default export. */
  load: () => Loaded | Promise<Loaded>
}

/**
 * Declares a command that is imported when it is needed. A command line
 * program starts faster when it loads the code of one command instead of all.
 *
 * ```ts
 * cliTransport({
 *   lazy: [
 *     lazyCommand({
 *       path: 'deploy <env>',
 *       description: 'Deploy the application',
 *       load: () => import('./commands/deploy.command.mjs').then((m) => m.DeployCommand),
 *     }),
 *   ],
 * })
 * ```
 */
export function lazyCommand(command: LazyCommand): LazyCommand {
  return command
}

export interface CliTransportOptions {
  /**
   * The name the program is run with, for usage lines.
   * @default the file name of the script, without its extension
   */
  name?: string
  /** One line about the program, for the top of its help. */
  description?: string
  /** What `--version` prints. Without it there is no such option. */
  version?: string
  /** Commands next to those that modules list in their own `commands`. */
  commands?: ClassType[]
  /** Commands that are imported when they are needed. */
  lazy?: LazyCommand[]
  /**
   * The command line to run when none is given, such as `'serve'` or
   * `'status --short'`. Without it the program prints its help.
   */
  defaultCommand?: string
}

interface Prepared {
  command: ClassType
  metadata: CommandMetadata
  spec: ArgsSpec
  chain: CommandChain
  /** Whether every run needs its own instance. */
  scoped: boolean
  instance: CommandHandler<unknown> | null
}

interface Entry {
  summary: CommandSummary
  node: ModuleNode
  command: ClassType | null
  load: LazyCommand['load'] | null
  prepared: Promise<Prepared> | null
}

/** Describes a command to something that lists them: a help page, a completion script. */
export type CommandInfo = Readonly<CommandSummary>

const HELP: CommandSummary = {
  path: 'help',
  params: [{ name: 'command', required: false, variadic: true }],
  aliases: [],
  description: 'Show help for a command',
  hidden: false,
}

function defaultName(): string {
  const script = process.argv[1]
  return script ? basename(script).replace(/\.[cm]?[jt]sx?$/, '') : 'cli'
}

/**
 * Runs the commands of an application. Get it with
 * `app.transport(cliTransport)`.
 */
export class CliTransport implements Transport {
  private readonly entries = new Map<string, Entry>()
  /** Every word sequence that is the beginning of a longer command path. */
  private readonly groups = new Set<string>()
  private maxWords = 1
  private root: ModuleNode | null = null
  private output: CliOutput | null = null
  private readonly running = new Map<AbortController, Promise<unknown>>()
  private stopped = false
  private runs = 0
  readonly program: ProgramInfo

  constructor(
    private readonly host: TransportHost,
    private readonly options: CliTransportOptions,
  ) {
    this.program = {
      name: options.name ?? defaultName(),
      description: options.description,
      version: options.version,
    }
  }

  // --- Transport ---

  async setup(graph: readonly ModuleNode[]): Promise<void> {
    this.root = graph.find((node) => node.isRoot) ?? graph[graph.length - 1] ?? null
    this.output = await this.host.container.get(CliOutput)
    for (const node of graph) {
      // Throws for an entry that is not a class.
      for (const command of moduleClasses(node, 'commands')) {
        if (!isCommand(command)) {
          throw new Error(
            `[Navios Commander] Module ${node.module.name} lists ${(command as ClassType).name} in commands, ` +
              'but it is not decorated with @Command.',
          )
        }
        this.add(command, node)
      }
    }
    const root = this.rootNode()
    for (const command of this.options.commands ?? []) {
      // Throws for a class that is not a command.
      getCommandMetadata(command)
      this.add(command, root)
    }
    for (const lazy of this.options.lazy ?? []) {
      this.addLazy(lazy, root)
    }
  }

  /**
   * Aborts the signal of every command that is running and waits for them,
   * at most `timeoutMs`.
   */
  async stop(timeoutMs: number): Promise<void> {
    this.stopped = true
    if (this.running.size === 0) {
      return
    }
    for (const controller of this.running.keys()) {
      controller.abort(new CliError('The application is closing', { exitCode: 130 }))
    }
    let timer: NodeJS.Timeout | undefined
    await Promise.race([
      Promise.allSettled(this.running.values()),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, Math.max(0, timeoutMs))
      }),
    ])
    clearTimeout(timer)
  }

  // --- For the application ---

  /** The commands of the application, in the order they were registered. */
  get commands(): CommandInfo[] {
    const unique = new Set<CommandSummary>()
    for (const entry of this.entries.values()) {
      unique.add(entry.summary)
    }
    return [...unique]
  }

  /**
   * Runs a command line and returns the exit code. It does not reject: an
   * error is printed the way a command line program prints it, and becomes
   * the code. Pass the arguments without the executable and the script.
   *
   * ```ts
   * process.exitCode = await app.transport(cliTransport).run()
   * ```
   */
  async run(args: readonly string[] = process.argv.slice(2)): Promise<number> {
    try {
      return await this.dispatch(args)
    } catch (error) {
      return this.report(error)
    }
  }

  /**
   * Runs a command line like `run()`, but rejects with what went wrong
   * instead of printing it: `CliUsageError` for a command line that cannot
   * be understood, and whatever the command threw.
   */
  async dispatch(args: readonly string[]): Promise<number> {
    if (this.stopped) {
      throw new CliError('The application is closing', { exitCode: 130 })
    }
    const output = this.requireOutput()
    if (args.length === 0) {
      const fallback = this.options.defaultCommand?.trim()
      if (!fallback) {
        output.write(this.commandList())
        return 0
      }
      args = fallback.split(/\s+/)
    }
    const first = args[0]
    if (first === '--help' || first === '-h') {
      output.write(this.commandList())
      return 0
    }
    if (this.program.version !== undefined && (first === '--version' || first === '-V')) {
      output.write(this.program.version)
      return 0
    }

    let leading = 0
    while (leading < args.length && !args[leading].startsWith('-')) {
      leading++
    }
    const found = this.find(args, leading)
    if (!found) {
      if (first === 'help') {
        output.write(await this.help(args.slice(1, leading).join(' ')))
        return 0
      }
      return this.unknown(args, leading)
    }

    const { entry, consumed } = found
    const prepared = await this.prepare(entry)
    const rest = args.slice(consumed)
    const parsed = parseArgs(rest, prepared.spec)
    if (parsed.help) {
      output.write(this.commandHelp(prepared))
      return 0
    }
    assignParams(parsed, prepared.spec)
    const options = await validateOptions(prepared.metadata.schema, parsed.options, prepared.spec)
    return this.execute(prepared, rest, options, parsed.positionals)
  }

  /**
   * The help text of a command, or of the program when no path is given.
   * @throws CliUsageError when there is no such command
   */
  async help(path = ''): Promise<string> {
    const words = path.trim() === '' ? [] : path.trim().split(/\s+/)
    if (words.length === 0) {
      return this.commandList()
    }
    const key = words.join(' ')
    const entry = this.entries.get(key)
    if (entry) {
      return this.commandHelp(await this.prepare(entry))
    }
    if (this.groups.has(key)) {
      return this.commandList(key)
    }
    throw this.unknownCommand(key)
  }

  // --- Registration ---

  private rootNode(): ModuleNode {
    if (!this.root) {
      throw new Error('[Navios Commander] The application has no module.')
    }
    return this.root
  }

  private requireOutput(): CliOutput {
    if (!this.output) {
      throw new Error(
        '[Navios Commander] The application is not initialised. Call app.init() or app.start() ' +
          'before running a command.',
      )
    }
    return this.output
  }

  private add(command: ClassType, node: ModuleNode): void {
    const metadata = getCommandMetadata(command)
    this.register(
      {
        summary: {
          path: metadata.path,
          params: metadata.params,
          aliases: metadata.aliases,
          description: metadata.description,
          hidden: metadata.hidden,
        },
        node,
        command,
        load: null,
        prepared: null,
      },
      metadata.words.length,
    )
  }

  private addLazy(lazy: LazyCommand, node: ModuleNode): void {
    const { words, params } = parseCommandPath(lazy.path)
    this.register(
      {
        summary: {
          path: words.join(' '),
          params,
          aliases: (lazy.aliases ?? []).map((alias) => parseCommandPath(alias).words.join(' ')),
          description: lazy.description,
          hidden: lazy.hidden ?? false,
        },
        node,
        command: null,
        load: lazy.load,
        prepared: null,
      },
      words.length,
    )
  }

  private register(entry: Entry, wordCount: number): void {
    const { path, aliases } = entry.summary
    for (const key of [path, ...aliases]) {
      const taken = this.entries.get(key)
      if (taken) {
        if (taken.command !== null && taken.command === entry.command) {
          // One class listed by two modules is one command.
          return
        }
        const name = (e: Entry) => e.command?.name ?? `the lazy command "${e.summary.path}"`
        throw new Error(
          `[Navios Commander] Two commands answer to "${key}": ${name(taken)} and ${name(entry)}.`,
        )
      }
    }
    for (const key of [path, ...aliases]) {
      this.entries.set(key, entry)
      const words = key.split(' ')
      this.maxWords = Math.max(this.maxWords, words.length, wordCount)
      for (let n = 1; n < words.length; n++) {
        this.groups.add(words.slice(0, n).join(' '))
      }
    }
  }

  // --- Lookup ---

  /** The command with the longest path that the leading words begin with. */
  private find(
    args: readonly string[],
    leading: number,
  ): { entry: Entry; consumed: number } | undefined {
    for (let n = Math.min(leading, this.maxWords); n >= 1; n--) {
      const entry = this.entries.get(n === 1 ? args[0] : args.slice(0, n).join(' '))
      if (entry) {
        return { entry, consumed: n }
      }
    }
    return undefined
  }

  private unknown(args: readonly string[], leading: number): number {
    if (leading === 0) {
      throw new CliUsageError(`Unknown option ${args[0]}`)
    }
    for (let n = Math.min(leading, this.maxWords); n >= 1; n--) {
      const key = args.slice(0, n).join(' ')
      if (this.groups.has(key)) {
        if (n === leading) {
          // `db` alone, when there are `db migrate` and `db seed`.
          this.requireOutput().write(this.commandList(key))
          return 0
        }
        throw this.unknownCommand(args.slice(0, n + 1).join(' '))
      }
    }
    throw this.unknownCommand(args[0])
  }

  private unknownCommand(written: string): CliUsageError {
    const candidates = [...this.entries.keys(), 'help']
    const near = closest(written, candidates) ?? closest(written.split(' ')[0], candidates)
    return new CliUsageError(
      `Unknown command "${written}"` + (near ? `. Did you mean "${near}"?` : ''),
    )
  }

  // --- Help ---

  private commandList(group?: string): string {
    let commands = this.commands
    if (group) {
      commands = commands.filter((command) => command.path.startsWith(group + ' '))
    } else if (!this.entries.has('help')) {
      commands = [...commands, HELP]
    }
    return renderCommandList(this.program, commands, group)
  }

  private commandHelp(prepared: Prepared): string {
    const { metadata, spec } = prepared
    return renderCommandHelp(
      this.program,
      {
        path: metadata.path,
        params: metadata.params,
        aliases: metadata.aliases,
        description: metadata.description,
        hidden: metadata.hidden,
        examples: metadata.examples,
      },
      spec,
    )
  }

  // --- Execution ---

  /**
   * Reads the schema of a command and resolves its guards and interceptors,
   * the first time the command is used. A program that runs one command
   * pays for one.
   */
  private prepare(entry: Entry): Promise<Prepared> {
    entry.prepared ??= this.prepareOnce(entry).catch((error: unknown) => {
      entry.prepared = null
      throw error
    })
    return entry.prepared
  }

  private async prepareOnce(entry: Entry): Promise<Prepared> {
    let command = entry.command
    if (command === null) {
      const loaded = await entry.load!()
      command = typeof loaded === 'function' ? loaded : loaded?.default
      const metadata = getCommandMetadata(command)
      if (metadata.path !== entry.summary.path) {
        throw new Error(
          `[Navios Commander] The lazy command "${entry.summary.path}" loaded ${command.name}, ` +
            `whose path is "${metadata.path}". Declare the same path in both places.`,
        )
      }
      entry.command = command
    }
    const metadata = getCommandMetadata(command)
    const spec = compileArgsSpec(metadata.path, describeSchema(metadata.schema), metadata.params)
    const chain = await commandChain(this.host, entry.node, command, metadata)
    return {
      command,
      metadata,
      spec,
      chain,
      scoped: needsScope(this.host.container, command),
      instance: null,
    }
  }

  private async execute(
    prepared: Prepared,
    args: readonly string[],
    options: unknown,
    positionals: readonly string[],
  ): Promise<number> {
    const { host } = this
    const controller = new AbortController()
    const ctx = new CommandContext({
      id: `cli-${++this.runs}`,
      handler: prepared.chain.info,
      host: host.contextHost,
      path: prepared.metadata.path,
      args,
      options,
      positionals,
      output: this.requireOutput(),
      signal: controller.signal,
    })
    const handler = async (): Promise<CommandResult> => {
      const instance = prepared.scoped
        ? ((await ctx.resolve(prepared.command)) as CommandHandler<unknown>)
        : (prepared.instance ??= (await host.container.get(
            prepared.command,
          )) as CommandHandler<unknown>)
      return instance.execute(options, ctx as CommandContext<never>)
    }
    // In the async context when the application keeps one, and with the
    // context finished afterwards, whatever the outcome.
    const run = executeChain(host, ctx, prepared.chain.resolved, handler, (guard) => {
      throw new CliError(`${prepared.metadata.path}: not allowed by ${guard.name}`)
    })
    this.running.set(controller, run)
    try {
      const result = await run
      return typeof result === 'number' ? result : 0
    } finally {
      this.running.delete(controller)
    }
  }

  private report(error: unknown): number {
    const output = this.output ?? { write() {}, error: (text: string) => console.error(text) }
    const { name } = this.program
    if (error instanceof CliUsageError) {
      output.error(`${name}: ${error.message}`)
      const help = error.command ? `${name} ${error.command} --help` : `${name} --help`
      output.error(`Run "${help}" for usage.`)
      return error.exitCode
    }
    if (error instanceof CliError) {
      output.error(`${name}: ${error.message}`)
      return error.exitCode
    }
    if (this.stopped) {
      // The command was interrupted and said so in its own way.
      return 130
    }
    output.error(error instanceof Error ? (error.stack ?? String(error)) : String(error))
    return 1
  }
}

/**
 * Runs the application's commands: the `@Command` classes that modules list
 * in `commands`, and those given in the options.
 *
 * ```ts
 * @Module({ commands: [GreetCommand] })
 * class AppModule {}
 *
 * const app = createApplication(AppModule, {
 *   transports: [cliTransport({ name: 'mycli', version: '1.0.0' })],
 * })
 * await app.start()
 * process.exitCode = await app.transport(cliTransport).run()
 * await app.close()
 * ```
 *
 * `runCli()` does all of that. Use the transport itself when the application
 * has other transports too, or runs several command lines.
 */
export const cliTransport = defineTransport<CliTransportOptions | void, CliTransport>({
  name: 'cli',
  create(host, options) {
    return new CliTransport(host, options ?? {})
  },
})
