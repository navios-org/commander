/**
 * Interface that all command classes must implement.
 *
 * Commands decorated with `@Command` must implement this interface.
 * The `execute` method is called when the command is invoked.
 *
 * @template TOptions - The type of options that the command accepts
 *
 * @example
 * ```typescript
 * import { Command, CommandHandler } from '@navios/commander'
 * import { z } from 'zod/v4'
 *
 * const optionsSchema = z.object({
 *   name: z.string()
 * })
 *
 * type Options = z.infer<typeof optionsSchema>
 *
 * @Command({ path: 'greet', optionsSchema })
 * export class GreetCommand implements CommandHandler<Options> {
 *   async execute(options: Options, positionals?: string[]) {
 *     console.log(`Hello, ${options.name}!`)
 *     if (positionals?.length) {
 *       console.log(`Files: ${positionals.join(', ')}`)
 *     }
 *   }
 * }
 * ```
 */
export interface CommandHandler<TOptions = any> {
  /**
   * Executes the command with the provided options and positional arguments.
   *
   * @param options - The validated command options (validated against the command's schema if provided)
   * @param positionals - Positional arguments that don't match any option flags
   * @returns A promise or void
   */
  execute(options: TOptions, positionals?: string[]): void | Promise<void>
}
