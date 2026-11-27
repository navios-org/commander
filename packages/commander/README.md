# @navios/commander

Command line applications out of classes: a command declares the words that select it and one
schema for its options. The parser, the validation, the help and the types of `execute()` all come
from that schema. Commands inject services like the rest of a [Navios](https://navios.tech)
application, of which the command line is one transport.

> 2.0 is in alpha and not compatible with 1.x. See
> [Migrating to 2.0](../../apps/docs/content/docs/reference/migrating-to-2.md).

## Install

```bash
npm install @navios/commander@next @navios/core@next zod
```

Node.js 24 or later, or Bun. `zod` is optional: any Standard Schema validates, and a zod 4 schema
is also read for the types of options, aliases and help.

## A program

```ts
import { Command, runCli } from '@navios/commander'
import { inject, Injectable, Module } from '@navios/core'
import { z } from 'zod'

import type { CommandContext, CommandHandler, CommandOptions } from '@navios/commander'

@Injectable()
class Deployer {
  async deploy(env: string) {}
}

const options = z.object({
  env: z.enum(['staging', 'production']),
  dryRun: z.boolean().default(false).meta({ alias: 'n', description: 'Change nothing' }),
})

@Command({ path: 'deploy <env>', description: 'Deploy the application', options })
class DeployCommand implements CommandHandler<typeof options> {
  private readonly deployer = inject(Deployer)

  async execute({ env, dryRun }: CommandOptions<typeof options>, ctx: CommandContext) {
    if (!dryRun) {
      await this.deployer.deploy(env)
    }
    ctx.output.write(`${dryRun ? 'Would deploy' : 'Deployed'} to ${env}`)
  }
}

@Module({ commands: [DeployCommand] })
class AppModule {}

await runCli(AppModule, { name: 'mycli', version: '1.0.0' })
```

```console
$ mycli deploy production -n
Would deploy to production

$ mycli deploy production --dry-rnu
mycli: Unknown option --dry-rnu. Did you mean --dry-run?
Run "mycli deploy --help" for usage.

$ mycli deploy --help
Usage: mycli deploy <env> [options]

Deploy the application

Arguments:
  <env>  (staging | production)

Options:
  -n, --dry-run  Change nothing
  -h, --help     Show help
```

## What it does

- **One schema per command.** Types of values, `--no-flag`, aliases, defaults, choices, nested
  objects (`--db.host`), lists and positional arguments (`'copy <source> [target]'`).
- **Help and errors.** Generated help for the program, groups and commands; typo suggestions;
  usage errors exit with 2, `CliError` with the code you give.
- **Dependency injection.** Services, modules, guards, interceptors and attributes of
  `@navios/core`. Nothing is built until a command needs it.
- **Lazy commands.** `lazyCommand()` imports a command's code only when it runs.
- **Tests.** `createTestCli()` from `@navios/commander/testing` runs command lines in memory and
  returns stdout, stderr and the exit code.
- **Legacy decorators.** `@navios/commander/legacy-compat` for `experimentalDecorators`.

## Documentation

The guide and the API reference are in [`apps/docs`](../../apps/docs/content/docs/index.md) of
this repository, and are published as a site by its `deploy-docs` workflow.

## License

MIT
