---
title: API reference
---

# API reference

## `@navios/commander`

### `runCli(module, options?)`

Builds the application, runs one command line, closes the application and sets `process.exitCode`. Returns `Promise<number>`, the exit code. Never rejects.

```ts
function runCli(appModule: ClassType, options?: RunCliOptions): Promise<number>
```

`RunCliOptions` is the options of `cliTransport()` and of `createApplication()` together, plus:

| Option | Type | Default |
| --- | --- | --- |
| `args` | `readonly string[]` | `process.argv.slice(2)` |
| `signals` | `NodeJS.Signals[] \| false` | `['SIGINT', 'SIGTERM']` |
| `logger` | `LogLevel[] \| LoggerService \| false` | `['log', 'warn', 'error', 'fatal']` |
| `transports` | `TransportInstance[]` | `[]` |

See [Running the program](/docs/essentials/running).

### `@Command(definition)`

Makes a class a command and registers it for dependency injection.

```ts
interface CommandDefinition<Schema> {
  path: string
  description?: string
  options?: Schema // a Standard Schema; a zod object is read for types and help
  aliases?: string[]
  examples?: string[]
  hidden?: boolean
  guards?: GuardClass[]
  interceptors?: InterceptorClass[]
  attributes?: AttributeValue[]
  scope?: InjectableScope
}
```

The decorated class must have an `execute()` that accepts what the schema produces. See [Commands](/docs/essentials/commands).

### `CommandHandler<Options>`

```ts
interface CommandHandler<Options = Record<string, unknown>> {
  execute(
    options: CommandOptions<Options>,
    ctx: CommandContext<CommandOptions<Options>>,
  ): void | number | Promise<void | number>
}
```

`Options` is a schema or the type of the options.

### `CommandOptions<Schema>`

The type a schema produces: `InferOutput<Schema>` for a Standard Schema, and the type itself for anything else.

### `CommandContext`

The context of one run, an `ExecutionContext` of `@navios/core` with `kind: 'cli'`.

| Member | Type | |
| --- | --- | --- |
| `path` | `string` | The command, as registered |
| `args` | `readonly string[]` | The arguments before parsing |
| `options` | `Options` | The validated options |
| `positionals` | `readonly string[]` | The arguments that are not options |
| `output` | `CliOutput` | Where the command prints |
| `signal` | `AbortSignal` | Aborts when the application closes |
| `id` | `string` | Unique per run in a process: `cli-1` |
| `handler` | `HandlerInfo` | The module, the class, guards, interceptors and attributes |
| `get`, `find`, `set`, `has` | | [Context keys](https://navios.tech/docs/server/essentials/request-context) |
| `use(token)`, `resolve(token)` | | Resolve a service for this run, synchronously or not |
| `onFinish(callback)` | | Runs after the command, whatever the outcome |

`isCommandContext(ctx)` tells whether a context of any transport is one.

### `cliTransport(options?)`

The transport, for `createApplication()`.

```ts
interface CliTransportOptions {
  name?: string
  description?: string
  version?: string
  commands?: ClassType[]
  lazy?: LazyCommand[]
  defaultCommand?: string
}
```

`app.transport(cliTransport)` returns the `CliTransport`:

| Member | |
| --- | --- |
| `run(args?): Promise<number>` | Runs a command line; prints errors and returns the exit code |
| `dispatch(args): Promise<number>` | Runs a command line; rejects with the error |
| `help(path?): Promise<string>` | The help of a command, a group or the program |
| `commands: CommandInfo[]` | Path, arguments, aliases, description and `hidden` of every command |
| `program` | The name, description and version |

### `lazyCommand(command)`

```ts
interface LazyCommand {
  path: string
  description?: string
  aliases?: string[]
  hidden?: boolean
  load: () => ClassType | { default: ClassType } | Promise<ClassType | { default: ClassType }>
}
```

See [Lazy commands](/docs/guides/lazy-commands).

### `CliError`, `CliUsageError`

```ts
new CliError(message, { exitCode = 1, cause }?)
new CliUsageError(message, command?) // exitCode 2
```

See [Errors of your own](/docs/essentials/help-and-errors#errors-of-your-own).

### `CliOutput`

An injection token and the type of what it resolves to:

```ts
interface CliOutput {
  write(text: string): void // one line to standard output
  error(text: string): void // one line to standard error
}
```

`processOutput` is the default.

### `OptionMeta`

What `.meta()` of a zod schema may carry for an option: `description`, `alias` (a string or an array) and `hidden`.

### `isCommand(target)`, `getCommandMetadata(target)`

Whether a class is a command, and what `@Command` recorded about it: path, words, arguments, aliases, description, examples and schema. For tools that generate documentation or shell completions.

## `@navios/commander/testing`

### `createTestCli(module, options?)`

```ts
function createTestCli(appModule: ClassType, options?: TestCliOptions): Promise<TestCli>

interface TestCli {
  app: Application
  transport: CliTransport
  run(commandLine: string | readonly string[]): Promise<CliResult>
  close(): Promise<void>
  [Symbol.asyncDispose](): Promise<void>
}

interface CliResult {
  exitCode: number
  stdout: string
  stderr: string
}
```

See [Testing](/docs/guides/testing).

## `@navios/commander/legacy-compat`

`Command`, for projects with `experimentalDecorators`. See [Legacy decorators](/docs/guides/legacy-decorators).

## `@navios/commander-tui`

| Export | |
| --- | --- |
| `tui(options?)` | The plugin. See [Terminal interface](/docs/tui/#options-of-tui). |
| `ScreenLogger` | Token of a logger for one screen: `inject(ScreenLogger, { screen, context?, enabledLevels? })` |
| `Screen` | Token of a screen: `inject(Screen, { name, icon?, static?, hidden?, badgeCount?, maxMessages? })` |
| `Prompt` | Token of the prompts of one screen: `inject(Prompt, { screen })` |
| `ScreenManager` | Token of the manager: `bind()`, `unbind()`, `getScreens()`, `getScreenByName()`, `createScreen()`, `removeScreen()` |
| `Adapter` | Token of the adapter that `tui({ adapter })` provides |
| `TuiAdapter`, `TuiMount`, `TuiMountProps` | The types an [adapter](/docs/tui/adapters#writing-an-adapter) implements |
| `darkTheme`, `lightTheme`, `highContrastTheme` | The built-in themes |
| `createTheme()`, `createThemeFrom()`, `mergeThemes()` | Make a theme from overrides |
| `KeyboardManager`, `createDefaultBindings()` | Key handling for adapters |
| `FilterEngine` | Filtering of messages by level and text, for adapters |

`@navios/commander-tui/react` exports the [hooks](/docs/tui/adapters#with-react) for adapters that render with React.

## `@navios/tui-adapter-ink`

`inkAdapter(): TuiAdapter`

## `@navios/tui-adapter-react`

`openTuiAdapter(): TuiAdapter`, and `openTuiSupport(): Promise<true | string>`, which tells whether OpenTUI can run in this process or why not.
