---
title: Running the program
---

# Running the program

## `runCli()`

One call does everything a command line program needs:

```ts title="cli.ts"
import { runCli } from '@navios/commander'

import { AppModule } from './app.module.js'

await runCli(AppModule, {
  name: 'mycli',
  description: 'Deploys things',
  version: '1.0.0',
})
```

It builds the application, runs the command that `process.argv` names, closes the application, sets `process.exitCode` and returns the code. It does not reject: a failure is printed and becomes the code.

### Options

| Option | Meaning |
| --- | --- |
| `name` | The name in usage lines. Defaults to the file name of the script. |
| `description` | One line at the top of the help. |
| `version` | What `--version` prints. Without it there is no such option. |
| `commands` | Commands next to those the modules list. |
| `lazy` | [Commands that are imported when needed](/docs/guides/lazy-commands). |
| `defaultCommand` | The command line to run when none is given, such as `'serve'`. |
| `args` | The command line. Defaults to `process.argv.slice(2)`. |
| `signals` | The signals that interrupt the command. Defaults to `['SIGINT', 'SIGTERM']`; `false` leaves them alone. |
| `logger` | The log levels, an output of your own, or `false`. Defaults to `['log', 'warn', 'error', 'fatal']`. |
| `providers`, `plugins`, `asyncContext`, `shutdownTimeout`, ... | Every option of [`createApplication()`](https://navios.tech/docs/server/essentials/application) of `@navios/core`. |
| `transports` | Transports next to the command line. |

### The command line starts after the script

`args` is the arguments without the executable and the script, which is `process.argv.slice(2)` under Node.js and Bun. A launcher that puts more in front, or a program that gets its command line from somewhere else, passes them itself:

```ts
await runCli(AppModule, { args: ['deploy', 'staging'] })
```

### Ctrl+C

On the first `SIGINT` or `SIGTERM` the application closes: `ctx.signal` of the running command aborts, the command gets up to `shutdownTimeout` (10 seconds) to finish, and services are shut down. The exit code is 130 or 143. A second signal ends the process at once.

### Making it executable

```json title="package.json"
{
  "type": "module",
  "bin": { "mycli": "./dist/cli.js" }
}
```

```ts title="src/cli.ts"
#!/usr/bin/env node
import { runCli } from '@navios/commander'
```

Compile with any tool that supports standard decorators: `tsc`, tsdown, esbuild, SWC with `decoratorVersion: '2022-03'`.

## The transport itself

`runCli()` is a few lines around `cliTransport()`. Use the transport directly when the program does more than run one command line: a REPL, a server that also accepts commands, a script that runs several.

```ts
import { cliTransport } from '@navios/commander'
import { createApplication } from '@navios/core'

const app = createApplication(AppModule, {
  transports: [cliTransport({ name: 'mycli', version: '1.0.0' })],
})
await app.start()

const cli = app.transport(cliTransport)
process.exitCode = await cli.run() // process.argv.slice(2)

await app.close()
```

| Member | Meaning |
| --- | --- |
| `cli.run(args?)` | Runs a command line and returns the exit code. Errors are printed, never thrown. |
| `cli.dispatch(args)` | The same, but rejects with what went wrong instead of printing it. |
| `cli.help(path?)` | The help of a command, a group or the program, as a string. |
| `cli.commands` | The commands: path, arguments, aliases, description. |

`run()` and `dispatch()` may be called any number of times, also concurrently. `app.close()` aborts the signal of every command that is still running and waits for them.

### A REPL in ten lines

```ts
import { createInterface } from 'node:readline/promises'

const app = createApplication(AppModule, { transports: [cliTransport({ name: '' })] })
await app.start()
const cli = app.transport(cliTransport)

const rl = createInterface({ input: process.stdin, output: process.stdout })
for await (const line of rl) {
  await cli.run(line.trim().split(/\s+/).filter(Boolean))
}
await app.close()
```

### Next to another transport

A worker that runs scheduled jobs and one maintenance command line at start:

```ts
import { scheduleTransport } from '@navios/schedule'

const app = createApplication(AppModule, {
  transports: [cliTransport(), scheduleTransport()],
})
await app.start()
await app.transport(cliTransport).run(['cache', 'warm'])
```
