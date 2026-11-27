---
title: Commands
---

# Commands

A command is a class decorated with `@Command` that has an `execute()` method. The decorator also registers the class for dependency injection, so do not add `@Injectable()`.

```ts
import { Command } from '@navios/commander'

import type { CommandContext, CommandHandler } from '@navios/commander'

@Command({ path: 'status', description: 'Show the status of the services' })
export class StatusCommand implements CommandHandler {
  execute(_options: Record<string, unknown>, ctx: CommandContext) {
    ctx.output.write('All systems operational')
  }
}
```

A command runs once it is listed in the `commands` of a module, or in the options of [`runCli()`](/docs/essentials/running).

## The path

`path` is the words that select the command, followed by the positional arguments it takes.

| Path | Run as |
| --- | --- |
| `'status'` | `mycli status` |
| `'db migrate'` | `mycli db migrate` |
| `'deploy <env>'` | `mycli deploy production` |
| `'copy <source> [target]'` | `mycli copy a.txt`, `mycli copy a.txt b.txt` |
| `'lint [...files]'` | `mycli lint`, `mycli lint a.ts b.ts` |

Arguments are described in [Arguments and options](/docs/essentials/arguments-and-options#positional-arguments).

### Subcommands

There is no parent command to declare. Commands whose paths begin with the same word form a group:

```ts
@Command({ path: 'db migrate', description: 'Run pending migrations' })
class MigrateCommand { /* ... */ }

@Command({ path: 'db seed', description: 'Fill the database with test data' })
class SeedCommand { /* ... */ }
```

```console
$ mycli db
Usage: mycli db <command> [options]

Commands:
  db migrate  Run pending migrations
  db seed     Fill the database with test data

Run "mycli <command> --help" for the options of a command.
```

When both `db` and `db migrate` are commands, the longest path that matches wins: `mycli db migrate` runs `db migrate`, and `mycli db other` runs `db` with the argument `other`.

### Aliases

```ts
@Command({ path: 'deploy <env>', aliases: ['d', 'ship'] })
```

`mycli d production` and `mycli ship production` run the same command. An alias is words only; the arguments are those of the path.

Two commands that answer to the same words are an error when the application starts, and the message names both classes.

## The options of `@Command`

| Option | Meaning |
| --- | --- |
| `path` | The words and the positional arguments. Required. |
| `description` | One line for command lists and the top of the command's help. |
| `options` | The [schema](/docs/essentials/arguments-and-options) of the options, arguments included. |
| `aliases` | Other words that select the command. |
| `examples` | Command lines for the help, without the name of the program. |
| `hidden` | Leave the command out of command lists. It can still be run. |
| `guards`, `interceptors`, `attributes` | See [Guards and interceptors](/docs/guides/guards-and-interceptors). |
| `scope` | The DI scope of the class. See [below](#one-instance-or-one-per-run). |

## `execute()`

```ts
execute(options, ctx): void | number | Promise<void | number>
```

`options` is what the schema made of the command line. Without a schema it is whatever was given, with types guessed.

`ctx` is the [`CommandContext`](/docs/reference/api#commandcontext) of this run:

| Member | Meaning |
| --- | --- |
| `ctx.output` | `write(text)` prints a line to standard output, `error(text)` to standard error. |
| `ctx.signal` | An `AbortSignal` that aborts when the application closes, as on Ctrl+C. |
| `ctx.path` | The command as it was registered: `'db migrate'`. |
| `ctx.args` | The arguments the command was given, before they were parsed. |
| `ctx.positionals` | The arguments that are not options, as they were written. |
| `ctx.onFinish(fn)` | Runs `fn` after the command, whatever the outcome. |
| `ctx.use(Token)` | Resolves a service for this run. |

### The exit code

A command that returns nothing exits with 0. Return a number to exit with it:

```ts
async execute() {
  const failures = await this.runner.run()
  return failures > 0 ? 1 : 0
}
```

To stop with a message, throw a [`CliError`](/docs/essentials/help-and-errors#errors-of-your-own). Never call `process.exit()` in a command: it skips the shutdown of your services and cuts off output that is still being written.

### Honouring Ctrl+C

Under `runCli()`, Ctrl+C closes the application, which aborts `ctx.signal` and then waits for the command. Pass the signal to what you call, or check it between steps:

```ts
async execute(options, ctx: CommandContext) {
  for (const file of options.files) {
    if (ctx.signal.aborted) break
    await upload(file, { signal: ctx.signal })
  }
}
```

## One instance or one per run

A command is a singleton: it is built the first time it runs, and never for a command line that does not use it. A program that handles many command lines in one process, such as a test suite or a REPL, can ask for a fresh instance each time:

```ts
import { InjectableScope } from '@navios/core'

@Command({ path: 'import <file>', scope: InjectableScope.Request })
```

Every run then gets its own instance, in a DI scope that is disposed after the run.
