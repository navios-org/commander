---
title: Output and logging
---

# Output and logging

A command line program writes two different things, and they go to different places.

| | Output | Log |
| --- | --- | --- |
| What | The result of the command | What the program tells about itself |
| For | Whoever ran the command, or the next program in a pipe | Whoever debugs the program |
| Written with | `ctx.output` / `CliOutput` | `Logger` of `@navios/core` |
| Goes to | Standard output; errors to standard error | The log output, by default the console |

## Output

In a command, use the context:

```ts
execute(options, ctx: CommandContext) {
  ctx.output.write('3 files changed') // standard output
  ctx.output.error('warning: 1 file skipped') // standard error
}
```

A service injects `CliOutput`:

```ts
import { CliOutput } from '@navios/commander'

@Injectable()
export class Reporter {
  private readonly output = inject(CliOutput)

  report(rows: Row[]) {
    for (const row of rows) {
      this.output.write(`${row.name}\t${row.status}`)
    }
  }
}
```

Each call writes one line. Because the output is injected, a [test](/docs/guides/testing) captures it, and a program can send it elsewhere:

```ts
await runCli(AppModule, {
  providers: [provide(CliOutput, { value: { write: (text) => socket.send(text), error: console.error } })],
})
```

Keep standard output clean when the result may be piped: `mycli list | grep foo` should see rows and nothing else. Progress and diagnostics belong on standard error or in the log.

## The log

```ts
import { inject, Logger } from '@navios/core'

@Injectable()
export class Deployer {
  private readonly logger = inject(Logger, { context: 'Deployer' })

  async deploy(env: string) {
    this.logger.debug(`Resolving the release for ${env}`)
    this.logger.log(`Deploying to ${env}`)
  }
}
```

Under `runCli()` the levels `log`, `warn`, `error` and `fatal` are shown. A `--verbose` flag of your own can widen that before the application is created:

```ts
const verbose = process.argv.includes('--verbose')

await runCli(AppModule, {
  logger: verbose ? ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'] : ['warn', 'error', 'fatal'],
})
```

`logger: false` switches the log off. An object with `log`, `warn` and `error` methods replaces the output, for instance to write JSON lines.

With the [terminal interface](/docs/tui/), the log goes to a screen of its own instead of the console.
