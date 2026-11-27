import { createApplication, provide } from '@navios/core'

import type { Application, ApplicationOptions, ClassType } from '@navios/core'

import { CliOutput } from '../output.mjs'
import { cliTransport } from '../transport/cli-transport.mjs'

import type { CliTransport, CliTransportOptions } from '../transport/cli-transport.mjs'

export interface TestCliOptions extends CliTransportOptions, Omit<ApplicationOptions, 'logger'> {
  /**
   * The log of the application. Off by default, so that a test sees only
   * what the command printed.
   * @default false
   */
  logger?: ApplicationOptions['logger']
}

/** What one command line did. */
export interface CliResult {
  exitCode: number
  /** What was printed to standard output, lines joined by `\n`. */
  stdout: string
  /** What was printed to standard error. */
  stderr: string
}

export interface TestCli {
  readonly app: Application
  readonly transport: CliTransport
  /**
   * Runs a command line and returns what it printed and its exit code. A
   * string is split at spaces; pass an array for arguments that contain them.
   */
  run(commandLine: string | readonly string[]): Promise<CliResult>
  /** Closes the application. */
  close(): Promise<void>
  [Symbol.asyncDispose](): Promise<void>
}

/**
 * Builds an application with the command line transport for a test. Nothing
 * is printed to the terminal: each `run()` returns its own output.
 *
 * ```ts
 * await using cli = await createTestCli(AppModule, {
 *   providers: [provide(Deployer, { value: fakeDeployer })],
 * })
 * const result = await cli.run('deploy staging --dry-run')
 * expect(result).toEqual({ exitCode: 0, stdout: 'Would deploy to staging', stderr: '' })
 * ```
 */
export async function createTestCli(
  appModule: ClassType,
  options: TestCliOptions = {},
): Promise<TestCli> {
  const {
    name = 'cli',
    description,
    version,
    commands,
    lazy,
    defaultCommand,
    providers = [],
    transports = [],
    logger = false,
    ...applicationOptions
  } = options

  let stdout: string[] = []
  let stderr: string[] = []
  const output: CliOutput = {
    write: (text) => void stdout.push(text),
    error: (text) => void stderr.push(text),
  }

  const app = createApplication(appModule, {
    ...applicationOptions,
    logger,
    providers: [provide(CliOutput, { value: output }), ...providers],
    transports: [
      cliTransport({ name, description, version, commands, lazy, defaultCommand }),
      ...transports,
    ],
  })
  await app.start()
  const transport = app.transport(cliTransport)

  // One at a time: the output of two command lines must not mix.
  let queue: Promise<unknown> = Promise.resolve()
  const run = (commandLine: string | readonly string[]): Promise<CliResult> => {
    const args =
      typeof commandLine === 'string'
        ? commandLine.trim().split(/\s+/).filter(Boolean)
        : commandLine
    const result = queue.then(async () => {
      stdout = []
      stderr = []
      const exitCode = await transport.run(args)
      return { exitCode, stdout: stdout.join('\n'), stderr: stderr.join('\n') }
    })
    queue = result.catch(() => {})
    return result
  }
  const close = () => app.close()
  return { app, transport, run, close, [Symbol.asyncDispose]: close }
}
