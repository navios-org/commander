---
title: Introduction
---

# Introduction

`@navios/commander` builds command line applications out of classes. A command declares the words that select it and one schema for its options. From that schema Commander parses the arguments, validates them, writes the help and types `execute()`.

```ts
const options = z.object({
  env: z.enum(['staging', 'production']),
  dryRun: z.boolean().default(false).meta({ alias: 'n', description: 'Change nothing' }),
})

@Command({ path: 'deploy <env>', description: 'Deploy the application', options })
export class DeployCommand implements CommandHandler<typeof options> {
  private readonly deployer = inject(Deployer)

  async execute({ env, dryRun }: CommandOptions<typeof options>) {
    await this.deployer.deploy(env, { dryRun })
  }
}
```

```console
$ mycli deploy production -n
$ mycli deploy --help
$ mycli deploy prod
mycli: <env>: Invalid option: expected one of "staging"|"production"
Run "mycli deploy --help" for usage.
```

## Where it fits

Commander is a *transport* of [`@navios/core`](https://navios.tech). An application is a tree of modules, one dependency injection container, and the transports through which work reaches it: HTTP is one, a schedule is another, the command line is a third. So a command line program:

- injects the same services as your server and shares its modules,
- uses the same guards, interceptors and attributes,
- can run next to other transports in one process.

You do not need the rest of Navios to use it. `@navios/commander` and `@navios/core` are enough for a standalone CLI.

## What is in the box

| You need | It is |
| --- | --- |
| A command with options and arguments | [`@Command`](/docs/essentials/commands) and a [schema](/docs/essentials/arguments-and-options) |
| `--help`, usage errors, exit codes | [built in](/docs/essentials/help-and-errors) |
| Services, configuration, modules | [dependency injection](/docs/essentials/services-and-modules) of `@navios/core` |
| To start the program | [`runCli()`](/docs/essentials/running) |
| To test a command | [`createTestCli()`](/docs/guides/testing) |
| A fast start with many commands | [lazy commands](/docs/guides/lazy-commands) |
| Screens, progress bars, prompts | [`@navios/commander-tui`](/docs/tui/) |

## Requirements

- Node.js 24 or later, or Bun.
- TypeScript 5 or later with standard decorators, which is the default. Projects that keep `experimentalDecorators` use the [legacy entry point](/docs/guides/legacy-decorators).
- A schema library is optional. Schemas of [zod](https://zod.dev) 4 give the most: types of options, aliases and help text are read from them. Any other [Standard Schema](https://standardschema.dev) validates.

:::info
This is the documentation of 2.0, which is in alpha and installed with the `next` tag. It is a rewrite on `@navios/core` 2.0 and not compatible with 1.x: see [Migrating to 2.0](/docs/reference/migrating-to-2).
:::

Continue with the [quick start](/docs/quick-start).
