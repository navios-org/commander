---
title: Migrating to 2.0
---

# Migrating to 2.0

Commander 2.0 is a rewrite on `@navios/core` 2.0. The ideas are the same, a class per command and a schema for its options, but the entry points, the parser and the way the terminal interface is switched on have all changed. This page lists every change with the old and the new code side by side.

## Versions

| Package | 1.x | 2.0 |
| --- | --- | --- |
| `@navios/commander` | 1.9 | 2.0 |
| `@navios/commander-tui` | 1.7 | 2.0 |
| `@navios/tui-adapter-ink` | 2.0 | 3.0 |
| `@navios/tui-adapter-react` | 2.0 | 3.0 |
| `@navios/tui-adapter-solid` | 2.0 | removed |
| `@navios/core` | 1.x | 2.0 |

Node.js 24 or later is required.

## Bootstrap

```ts title="1.x"
const app = await CommanderFactory.create(AppModule)
await app.init()
await app.getAdapter().run(process.argv)
await app.close()
```

```ts title="2.0"
await runCli(AppModule, { name: 'mycli' })
```

`runCli()` also closes the application when the command fails, sets the exit code, and handles Ctrl+C. `CommanderFactory`, `defineCliEnvironment()` and `app.getAdapter()` are gone; the command line is a transport, [`cliTransport()`](/docs/essentials/running#the-transport-itself).

`run()` now takes the arguments **without** the executable and the script: `process.argv.slice(2)`, which is the default. The 1.x search for the first known command word in `argv` is removed, because it guessed wrong when an argument happened to be the name of a command.

## Modules

```ts title="1.x"
import { CliModule } from '@navios/commander'

@CliModule({ commands: [GreetCommand], imports: [OtherModule] })
```

```ts title="2.0"
import { Module } from '@navios/core'

@Module({ commands: [GreetCommand], imports: [OtherModule] })
```

`@CliModule` is removed. `commands` is an option of `@Module`, next to `controllers` and the options of other transports.

`@navios/commander` no longer re-exports `@navios/core`. Import `inject`, `Injectable`, `Module`, `Logger` and the rest from `@navios/core`.

## Commands

```ts title="1.x"
@Command({ path: 'greet', description: 'Greets', optionsSchema: schema })
export class GreetCommand implements CommandHandler<Options> {
  async execute(options: Options, positionals?: string[]) {}
}
```

```ts title="2.0"
@Command({ path: 'greet <name>', description: 'Greets', options: schema })
export class GreetCommand implements CommandHandler<typeof schema> {
  async execute(options: CommandOptions<typeof schema>, ctx: CommandContext) {}
}
```

| 1.x | 2.0 |
| --- | --- |
| `optionsSchema` | `options` |
| `execute(options, positionals)` | `execute(options, ctx)`; positionals are [declared in the path](/docs/essentials/arguments-and-options#positional-arguments) and arrive in the options, or raw in `ctx.positionals` |
| `token`, `priority`, `registry` of `@Command` | removed, as in `@navios/di` 2.0. Replace a command by not listing it. |
| `CommandExecutionContext` token, `getCommandPath()`, `getOptions()` | `ctx.path`, `ctx.options` of the context that `execute()`, guards and interceptors receive |
| every run in a request scope | a scope only when something needs one |
| `adapter.executeCommand(path, options)` | `cli.dispatch(args)` |
| `adapter.getAllCommands()` | `cli.commands` |
| `CommandRegistryService`, `CliParserService` | internal; use `cli.commands` and `cli.help()` |

## The parser

The parser is new. A command line that worked may be read differently:

| Command line | 1.x | 2.0 |
| --- | --- | --- |
| `copy a.txt b.txt` | error: "Command not found: copy a.txt b.txt" | `copy` with two arguments |
| `--name 123` with `z.string()` | `123`, then a validation error | `'123'` |
| `--offset -5` | `offset: true` and an option `5` | `-5` |
| `--force a.txt` with `force: z.boolean()` unknown to the parser | `force: 'a.txt'` | `force: true`, argument `a.txt` |
| `--no-color` | `noColor: true` | `color: false` |
| `-- --literal` | an option named `''` | the argument `--literal` |
| `-h localhost` with an option aliased `h` | help | `host: 'localhost'` |
| `--typo` with a zod object | silently dropped by zod | error with a suggestion |
| `--__proto__.x=1` | wrote to `Object.prototype` | error |
| `--value null`, `--value undefined` | `null`, `undefined` | the strings, unless the schema says otherwise |
| extra arguments | passed along | error, unless the path declares `[...rest]` |

Aliases are new: `z.boolean().meta({ alias: 'v' })`.

## Help and errors

- Help goes to standard output as plain text. In 1.x it went through the logger, with a level and a context in front of every line.
- A usage error prints one line and exits with 2. In 1.x a `ZodError` was logged as JSON, the list of commands was printed, and the error was thrown at the caller.
- `run()` returns the exit code and does not throw. Use `dispatch()` to get the error.
- Throw `CliError` to exit with a message and a code.

## Logging

`CommanderFactory.create(module, { logger: { showPid, ... } })` is replaced by the `logger` option of `runCli()`, which is that of `createApplication()`: levels, an output object, or `false`. `runCli()` shows `log`, `warn`, `error` and `fatal` by default.

What a command prints for the person who ran it goes through [`ctx.output`](/docs/guides/output-and-logging), not the logger.

## Terminal interface

```ts title="1.x"
const app = await CommanderFactory.create(AppModule, {
  enableTUI: true,
  tuiOptions: { adapter: 'ink', sidebarTitle: 'My CLI', hideDefaultScreen: true },
})
```

```ts title="2.0"
import { tui } from '@navios/commander-tui'
import { inkAdapter } from '@navios/tui-adapter-ink'

await runCli(AppModule, {
  plugins: [tui({ adapter: inkAdapter(), sidebar: { title: 'My CLI' }, logScreen: { hidden: true } })],
})
```

| 1.x | 2.0 |
| --- | --- |
| `enableTUI`, `tuiOptions` | the `tui()` plugin |
| `adapter: 'ink' \| 'react' \| 'solid'` | `adapter: inkAdapter()` or `openTuiAdapter()`; the Solid adapter is removed |
| importing an adapter package for its side effect | pass the adapter; importing a package registers nothing |
| `useOpenTUI` | removed; the adapter knows whether it can run |
| `sidebarWidth`, `sidebarPosition`, `sidebarTitle` | `sidebar: { width, position, title }` |
| `useMouse` | `mouse` |
| `hideDefaultScreen` | `logScreen: { hidden: true }` |
| `overrideConsoleLogger()` | done by the plugin; `logScreen: false` to opt out |
| `IsomorphicLogger` | removed; `Logger` of core is routed to a screen, and `ScreenLogger` works without an interface |
| `manager.isTuiBound()`, `isOpenTUIActive()` | `manager.isInteractive()`, `manager.hasTuiRenderer()` |
| `@opentui/core` as a peer of `@navios/commander-tui` | a dependency of `@navios/tui-adapter-react` only |

Behaviour that changed:

- `prompt.confirm()` defaults to **no**. It defaulted to yes, which unattended runs then answered.
- A prompt's `timeout` starts when the prompt is shown, and open prompts resolve with their defaults when the interface closes instead of never.
- `choice()` throws for a `defaultChoice` that is not among the choices.
- Screens keep at most 10 000 messages (`maxMessages`).
- `file()`, `diff()` and `fileError()` are shown at the `log` level, not `debug`.
- Output that is not a terminal gets no colour codes.
- The Ink adapter no longer depends on OpenTUI being available.

### Adapters

The contract is one method. An adapter written for 1.x:

```ts title="1.x"
@Injectable({ token: Adapter })
class MyAdapter implements AdapterInterface {
  handlesOwnRenderer = true
  createRoot() { /* ... */ }
  renderToRoot(root, props) { /* ... */ }
}
```

```ts title="2.0"
export function myAdapter(): TuiAdapter {
  return {
    name: 'mine',
    async mount({ manager, theme, options }) {
      /* ... */
      return { unmount() { /* ... */ } }
    },
  }
}
```

See [Writing an adapter](/docs/tui/adapters#writing-an-adapter).

## Dependency injection

Commander follows `@navios/di` 2.0: no registry and no priorities, scopes instead of request ids, `provide()` to replace a service. The [DI migration guide](https://navios.tech/docs/di/reference/migrating-to-2) has the details.
