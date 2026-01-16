import { createClassContext } from '@navios/core/legacy-compat'

import type { ClassType } from '@navios/core'

import {
  Command as OriginalCommand,
  type CommandOptions,
} from '../../decorators/command.decorator.mjs'

export type { CommandOptions }

/**
 * Legacy-compatible Command decorator.
 *
 * Works with TypeScript experimental decorators (legacy API).
 *
 * @param options - Command configuration options
 * @returns A class decorator compatible with legacy decorator API
 *
 * @example
 * ```typescript
 * import { Command, CommandHandler } from '@navios/commander/legacy-compat'
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
export function Command(options: CommandOptions) {
  return function (target: ClassType) {
    const context = createClassContext(target)
    const originalDecorator = OriginalCommand(options)
    return originalDecorator(target, context)
  }
}
