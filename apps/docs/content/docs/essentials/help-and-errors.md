---
title: Help, errors and exit codes
---

# Help, errors and exit codes

## Help

Help is generated. There is nothing to write beyond the descriptions in `@Command` and in the schema.

| Command line | Prints |
| --- | --- |
| `mycli`, `mycli --help`, `mycli help` | The list of commands |
| `mycli deploy --help`, `mycli deploy -h`, `mycli help deploy` | The help of a command |
| `mycli db`, `mycli help db` | The commands of a group |
| `mycli --version`, `mycli -V` | The version, when one is configured |

```console
$ mycli
Usage: mycli <command> [options]

Commands:
  deploy <env>       Deploy the application
  help [...command]  Show help for a command

Options:
  -h, --help     Show help
  -V, --version  Show the version

Run "mycli <command> --help" for the options of a command.
```

The name, the description at the top and the version come from the options of [`runCli()`](/docs/essentials/running):

```ts
await runCli(AppModule, {
  name: 'mycli',
  description: 'Deploys things',
  version: '1.0.0',
})
```

Without `name`, the file name of the script is used.

### Details

- A command with `hidden: true` is left out of the lists, and an option with `.meta({ hidden: true })` out of the help of its command.
- `-h` means help unless the command gives that letter to an option of its own, such as `host: z.string().meta({ alias: 'h' })`. `--help` is taken the same way by an option named `help`.
- A command of your own with the path `help` replaces the built-in one.
- To run a command instead of printing the list when no arguments are given, set `defaultCommand: 'serve'`.

To get a help text as a string, for a README or a web page, ask the transport: `await app.transport(cliTransport).help('deploy')`.

## Usage errors

A command line that cannot be understood is answered on standard error with one line that says what is wrong and one that says where the help is. The process exits with **2**.

```console
$ mycli depoly
mycli: Unknown command "depoly". Did you mean "deploy"?
Run "mycli --help" for usage.

$ mycli deploy production --dry-rnu
mycli: Unknown option --dry-rnu. Did you mean --dry-run?
Run "mycli deploy --help" for usage.

$ mycli deploy nowhere
mycli: <env>: Invalid option: expected one of "staging"|"production"
Run "mycli deploy --help" for usage.
```

Every issue the schema reports is listed, each under the name of its option or argument:

```console
$ mycli serve --port abc --mode c
mycli: The command line has 3 problems:
  --port: Invalid input: expected number, received string
  Missing option --region
  --mode: Invalid option: expected one of "a"|"b"
Run "mycli serve --help" for usage.
```

The messages after the colon are those of your schema. Customise them there: `z.number({ error: 'must be a port number' })`.

## Errors of your own

Throw a `CliError` to stop a command with a message for the person at the terminal. The message is printed as it is, without a stack, and the process exits with the code you give, or 1.

```ts
import { CliError } from '@navios/commander'

async execute({ env }: Options) {
  const release = await this.releases.latest(env)
  if (!release) {
    throw new CliError(`Nothing to deploy to ${env}`, { exitCode: 3 })
  }
}
```

```console
$ mycli deploy staging
mycli: Nothing to deploy to staging
$ echo $?
3
```

`CliUsageError` is the `CliError` of a wrong command line: exit code 2, and the pointer to the help. Throw it for a rule the schema cannot express:

```ts
throw new CliUsageError('--since and --until cannot be combined', ctx.path)
```

## Crashes

Anything else a command throws is a bug of the program. It is printed with its stack, and the process exits with 1.

## Exit codes

| Code | When |
| --- | --- |
| `0` | The command returned nothing, or help was printed. |
| a number | The command returned it. |
| `2` | The command line was wrong (`CliUsageError`). |
| `exitCode` of a `CliError`, by default `1` | The command threw one. A guard that refuses is a `CliError` with code 1. |
| `1` | The command crashed, or the application could not start. |
| `130`, `143` | The program was interrupted by Ctrl+C, or terminated. |

`runCli()` sets `process.exitCode` and returns the code. It never calls `process.exit()`, so output that is still being written is not cut off.
