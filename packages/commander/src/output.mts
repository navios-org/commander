import { InjectionToken, registerProvider } from '@navios/core'

/**
 * Where a command line application prints what is meant for the person who
 * ran it: results and help on standard output, errors on standard error.
 * Each call prints one line; the line break is added.
 *
 * It is not the log. `Logger` is for what a program tells about itself.
 */
export interface CliOutput {
  write(text: string): void
  error(text: string): void
}

/**
 * The output of the application. Inject it in a service, or use `ctx.output`
 * in a command. Provide another one to send it elsewhere:
 *
 * ```ts
 * createApplication(AppModule, {
 *   providers: [provide(CliOutput, { value: myOutput })],
 * })
 * ```
 */
export const CliOutput = InjectionToken.create<CliOutput>('CliOutput')

/** Prints to the standard streams of the process. */
export const processOutput: CliOutput = {
  write(text) {
    process.stdout.write(text + '\n')
  },
  error(text) {
    process.stderr.write(text + '\n')
  },
}

registerProvider(CliOutput, { value: processOutput })
