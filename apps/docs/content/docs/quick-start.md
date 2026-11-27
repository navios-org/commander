---
title: Quick start
---

# Quick start

A program with one command, its help and a test, in five steps.

## 1. Install

```bash
npm install @navios/commander@next @navios/core@next zod
```

`zod` is optional, but this guide uses it.

## 2. Check the compiler options

Commander uses standard decorators. Make sure `tsconfig.json` does **not** set `experimentalDecorators`:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "strict": true
  }
}
```

To run TypeScript directly, use a runner that understands decorators, such as `bun cli.ts` or `tsx cli.ts`. Node.js alone strips types but does not transform decorators.

## 3. Write a command

```ts title="deploy.command.ts"
import { Command } from '@navios/commander'
import { inject, Injectable } from '@navios/core'
import { z } from 'zod'

import type { CommandContext, CommandHandler, CommandOptions } from '@navios/commander'

@Injectable()
export class Deployer {
  async deploy(env: string, tags: string[]): Promise<void> {
    // the real work
  }
}

const options = z.object({
  env: z.enum(['staging', 'production']),
  dryRun: z.boolean().default(false).meta({ alias: 'n', description: 'Change nothing' }),
  tag: z.array(z.string()).default([]).meta({ description: 'Tags to deploy' }),
})

@Command({
  path: 'deploy <env>',
  description: 'Deploy the application',
  options,
  examples: ['deploy production --dry-run'],
})
export class DeployCommand implements CommandHandler<typeof options> {
  private readonly deployer = inject(Deployer)

  async execute({ env, dryRun, tag }: CommandOptions<typeof options>, ctx: CommandContext) {
    const tags = tag.length > 0 ? ` (${tag.join(', ')})` : ''
    if (dryRun) {
      ctx.output.write(`Would deploy to ${env}${tags}`)
      return
    }
    await this.deployer.deploy(env, tag)
    ctx.output.write(`Deployed to ${env}${tags}`)
  }
}
```

Three things to notice:

- `deploy <env>` declares a positional argument. It arrives in the options under its name, so the schema validates it like any option.
- `execute()` is typed by the schema. If it asks for an option the schema does not produce, the decorator does not compile.
- `ctx.output.write()` prints a line to standard output. Use it instead of `console.log`, and tests can read what was printed.

## 4. Start the program

```ts title="cli.ts"
import { runCli } from '@navios/commander'
import { Module } from '@navios/core'

import { DeployCommand } from './deploy.command.js'

@Module({ commands: [DeployCommand] })
class AppModule {}

await runCli(AppModule, { name: 'mycli', version: '1.0.0' })
```

`runCli()` builds the application, runs the command the arguments name, closes the application and sets the exit code.

```console
$ mycli deploy production --dry-run
Would deploy to production

$ mycli deploy staging -n --tag v2 --tag canary
Would deploy to staging (v2, canary)

$ mycli deploy --help
Usage: mycli deploy <env> [options]

Deploy the application

Arguments:
  <env>  (staging | production)

Options:
  -n, --dry-run          Change nothing
      --tag <string...>  Tags to deploy (repeatable)
  -h, --help             Show help

Examples:
  mycli deploy production --dry-run
```

Mistakes are answered the way people expect from a command line tool, with exit code 2:

```console
$ mycli deploy production --dry-rnu
mycli: Unknown option --dry-rnu. Did you mean --dry-run?
Run "mycli deploy --help" for usage.

$ mycli deploy
mycli: Missing argument <env>
Run "mycli deploy --help" for usage.
```

## 5. Test it

`createTestCli()` runs command lines in memory. Replace the service that does the real work, and assert on what was printed:

```ts title="deploy.command.spec.ts"
import { createTestCli } from '@navios/commander/testing'
import { provide } from '@navios/core'
import { expect, it } from 'vitest'

it('deploys', async () => {
  const deployed: string[] = []
  await using cli = await createTestCli(AppModule, {
    providers: [provide(Deployer, { value: { deploy: async (env) => void deployed.push(env) } })],
  })

  expect(await cli.run('deploy staging')).toEqual({
    exitCode: 0,
    stdout: 'Deployed to staging',
    stderr: '',
  })
  expect(deployed).toEqual(['staging'])
})
```

## Where to go next

- [Commands](/docs/essentials/commands): paths, subcommands, aliases, return values.
- [Arguments and options](/docs/essentials/arguments-and-options): everything the parser understands.
- [Services and modules](/docs/essentials/services-and-modules): organising a larger program.
- [Terminal interface](/docs/tui/): screens, progress and prompts.
