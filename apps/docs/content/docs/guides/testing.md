---
title: Testing
---

# Testing

`@navios/commander/testing` runs command lines in memory, with the real parser, the real validation and the real dependency injection. No process is started and nothing is printed to your terminal.

## A first test

```ts
import { createTestCli } from '@navios/commander/testing'
import { expect, it } from 'vitest'

import { AppModule } from './app.module.js'

it('greets', async () => {
  await using cli = await createTestCli(AppModule)

  const result = await cli.run('greet World --shout')

  expect(result).toEqual({ exitCode: 0, stdout: 'HELLO, WORLD!', stderr: '' })
})
```

`cli.run()` takes the command line as a string, which is split at spaces, or as an array when an argument contains a space:

```ts
await cli.run(['greet', 'Ada Lovelace', '--greeting=Good day'])
```

It returns what the command line printed and the exit code it would have had:

| Field | Meaning |
| --- | --- |
| `exitCode` | `0`, the number the command returned, `2` for a usage error, the code of a `CliError`, `1` for a crash. |
| `stdout` | The lines written with `ctx.output.write()` and the help, joined by `\n`. |
| `stderr` | The lines written with `ctx.output.error()`, and error messages. |

`await using` closes the application at the end of the test. Without it, call `await cli.close()`.

:::tip
Only what goes through `ctx.output` (or the injected `CliOutput`) is captured. A `console.log()` in a command goes to the terminal of the test run. That is the reason to prefer `ctx.output` in commands.
:::

## Replacing services

Give the test the providers it needs. They win over what the modules provide:

```ts
import { provide } from '@navios/core'

it('deploys the latest release', async () => {
  const deploy = vi.fn()
  await using cli = await createTestCli(AppModule, {
    providers: [
      provide(Deployer, { value: { deploy } }),
      provide(ReleaseStore, { class: InMemoryReleaseStore }),
    ],
  })

  await cli.run('deploy staging')

  expect(deploy).toHaveBeenCalledWith('staging', { dryRun: false })
})
```

## Testing mistakes

Usage errors are results like any other:

```ts
it('explains a wrong environment', async () => {
  await using cli = await createTestCli(AppModule, { name: 'mycli' })

  const result = await cli.run('deploy nowhere')

  expect(result.exitCode).toBe(2)
  expect(result.stderr).toContain('<env>: Invalid option')
})
```

To assert on the error itself, use `dispatch()` of the transport, which rejects instead of printing:

```ts
import { CliUsageError } from '@navios/commander'

await expect(cli.transport.dispatch(['deploy'])).rejects.toBeInstanceOf(CliUsageError)
```

## Testing one command

A test does not need the whole application. An empty module and the command under test are enough:

```ts
@Module({})
class TestModule {}

await using cli = await createTestCli(TestModule, {
  commands: [DeployCommand],
  providers: [provide(Deployer, { value: fakeDeployer })],
})
```

## Snapshots of the help

The help is part of the interface of your program. A snapshot notices when it changes:

```ts
it('documents deploy', async () => {
  await using cli = await createTestCli(AppModule, { name: 'mycli' })
  expect((await cli.run('deploy --help')).stdout).toMatchInlineSnapshot()
})
```

## Options

`createTestCli(module, options)` takes the options of [`runCli()`](/docs/essentials/running#options) except `args` and `signals`. Two defaults differ: `name` is `'cli'`, and `logger` is `false`, so that the log of the application does not end up in a test's output. Pass `logger: ['error']` or an output of your own to see it.

The object it returns also has `app`, the application, and `transport`, the `CliTransport`.

## Testing a service

A service that does not depend on the command line is tested with the container alone. See [Testing](https://navios.tech/docs/di/guides/testing) in the DI documentation.
