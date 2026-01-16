import { Injectable, InjectableScope, InjectionToken } from '@navios/core'

import type { ClassType, ClassTypeWithInstance, Registry } from '@navios/core'
import type { z } from 'zod/v4'

import { getCommandMetadata } from '../metadata/index.mjs'

import type { CommandHandler } from '../interfaces/index.mjs'

/**
 * Options for the `@Command` decorator.
 *
 * @public
 */
export interface CommandOptions {
  /**
   * The token to use for the command.
   * If provided, the command will be registered with this token.
   */
  token?: InjectionToken<ClassTypeWithInstance<CommandHandler<any>>>
  /**
   * The command path that users will invoke from the CLI.
   * Can be a single word (e.g., 'greet') or multi-word with colons (e.g., 'user:create', 'db:migrate').
   */
  path: string
  /**
   * Optional description of the command for help text.
   * Displayed when users run `help` or `--help`.
   */
  description?: string
  /**
   * Optional zod/v4 schema for validating command options.
   * If provided, options will be validated and parsed according to this schema.
   */
  optionsSchema?: z.ZodObject
  /**
   * Priority level for the command.
   * Higher priority commands will be loaded first.
   */
  priority?: number
  /**
   * Registry to use for the command.
   * Registry is used to store the command and its options schema.
   */
  registry?: Registry
}

/**
 * Decorator that marks a class as a CLI command.
 *
 * The decorated class must implement the `CommandHandler` interface with an `execute` method.
 * The command will be automatically registered when its module is loaded.
 *
 * @param options - Configuration options for the command
 * @returns A class decorator function
 *
 * @example
 * ```typescript
 * import { Command, CommandHandler } from '@navios/commander'
 * import { z } from 'zod/v4'
 *
 * const optionsSchema = z.object({
 *   name: z.string(),
 *   greeting: z.string().optional().default('Hello')
 * })
 *
 * @Command({
 *   path: 'greet',
 *   optionsSchema: optionsSchema
 * })
 * export class GreetCommand implements CommandHandler<z.infer<typeof optionsSchema>> {
 *   async execute(options) {
 *     console.log(`${options.greeting}, ${options.name}!`)
 *   }
 * }
 * ```
 */
export function Command({
  path,
  description,
  token,
  optionsSchema,
  priority,
  registry,
}: CommandOptions) {
  return function (target: ClassType, context: ClassDecoratorContext) {
    if (context.kind !== 'class') {
      throw new Error('[Navios Commander] @Command decorator can only be used on classes.')
    }
    const tokenToUse =
      token ?? InjectionToken.create<ClassTypeWithInstance<CommandHandler<any>>>(target)

    if (context.metadata) {
      getCommandMetadata(target, context, path, description, optionsSchema)
    }
    // @ts-expect-error Injectable is callable
    return Injectable({
      token: tokenToUse,
      scope: InjectableScope.Singleton,
      priority,
      registry,
    })(target, context)
  }
}
