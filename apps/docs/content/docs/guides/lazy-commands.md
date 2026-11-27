---
title: Lazy commands
---

# Lazy commands

A command line program is started for one command and then exits. The time to import the code of every other command is wasted, and with heavy dependencies it is most of the start-up time.

A lazy command is imported when it runs, or when its help is asked for.

## Declaring one

Write the command as usual, and do not list it in a module. Declare it in the options of `runCli()` instead, with the path and the description that command lists need:

```ts title="cli.ts"
import { lazyCommand, runCli } from '@navios/commander'

import { AppModule } from './app.module.js'

await runCli(AppModule, {
  name: 'mycli',
  lazy: [
    lazyCommand({
      path: 'deploy <env>',
      description: 'Deploy the application',
      load: () => import('./commands/deploy.command.js').then((m) => m.DeployCommand),
    }),
    lazyCommand({
      path: 'report',
      description: 'Render the monthly report',
      // A default export works without `.then()`.
      load: () => import('./commands/report.command.js'),
    }),
  ],
})
```

`mycli --help` lists both without importing either. `mycli deploy production` imports `deploy.command.js`, and with it only the services that command injects.

## Rules

- The `path` of the declaration must be the path of the `@Command` it loads, arguments included. Commander checks this when the command is loaded and names both when they differ.
- `aliases` and `hidden` are declared with `lazyCommand()` too, since they are needed before the class is known.
- A lazy command belongs to the root module: the guards, interceptors and attributes of that module apply to it, and its own.
- The services it injects are found through the import of the command file, as always. Nothing else has to be registered.

## What is already lazy

Even without `lazyCommand()`, a command that is listed in a module costs little until it runs:

- its class is imported, but not constructed,
- its schema is not read,
- its guards and interceptors are not resolved,
- the services it injects are not built.

So reach for `lazyCommand()` when *importing* a command is expensive, typically because of what the file imports at the top: a bundler, a cloud SDK, a database driver.

## Measuring

```console
$ node --cpu-prof dist/cli.js --help
```

If `--help` takes noticeably longer than `node -e 0`, look at what the entry file imports. Moving the heaviest commands to `lazy` is usually enough.
