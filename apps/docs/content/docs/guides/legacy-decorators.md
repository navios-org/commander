---
title: Legacy decorators
---

# Legacy decorators

Commander is written for standard (stage 3) decorators, which TypeScript uses by default. A project that sets `experimentalDecorators: true`, for instance because another library needs it, imports the decorators from the `legacy-compat` entry points instead.

```ts
import { runCli } from '@navios/commander'
import { Command } from '@navios/commander/legacy-compat'
import { Injectable, Module } from '@navios/core/legacy-compat'
import { inject } from '@navios/core'

@Injectable()
class Greeter {
  greet(name: string) {
    return `Hello, ${name}!`
  }
}

@Command({ path: 'greet <name>', options: z.object({ name: z.string() }) })
class GreetCommand {
  private readonly greeter = inject(Greeter)

  execute({ name }: { name: string }, ctx: CommandContext) {
    ctx.output.write(this.greeter.greet(name))
  }
}

@Module({ commands: [GreetCommand] })
class AppModule {}

await runCli(AppModule)
```

Only the decorators differ. `runCli`, `cliTransport`, `inject`, `CliError`, the types and everything else come from the main entry points and work with both kinds.

| Standard | Legacy |
| --- | --- |
| `Command` from `@navios/commander` | `Command` from `@navios/commander/legacy-compat` |
| `Module`, `Injectable`, `Factory`, `UseGuards`, `UseInterceptors` from `@navios/core` | the same names from `@navios/core/legacy-compat` |

One difference in types: the legacy `@Command` does not check `execute()` against the schema, because a legacy decorator cannot see the type of the class it is applied to as precisely. Type the options yourself with `CommandOptions<typeof schema>`.

`emitDecoratorMetadata` is not needed: dependencies are injected with `inject()`, not through constructor parameter types.
