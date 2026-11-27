import type { ClassType, StandardSchemaV1 } from '@navios/core'
import type { HandlerClassMetadata } from '@navios/core/transport'

import type { CommandParam } from '../parser/command-path.mjs'

/** What `@Command` recorded about a class. */
export interface CommandMetadata {
  /** The words that select the command, joined by a space: `'db migrate'`. */
  path: string
  words: string[]
  /** The positional arguments the path declares. */
  params: CommandParam[]
  /** Other word sequences that select the command. */
  aliases: string[]
  description?: string
  examples: string[]
  /** Left out of command lists. */
  hidden: boolean
  schema?: StandardSchemaV1
  /** The guards, interceptors and attributes of the class, and of `execute`. */
  owner: HandlerClassMetadata
}

const CommandMetadataKey = Symbol.for('navios.commander.command')

/** @internal */
export function defineCommandMetadata(target: ClassType, metadata: CommandMetadata): void {
  Object.defineProperty(target, CommandMetadataKey, {
    value: metadata,
    configurable: true,
    enumerable: false,
  })
}

/**
 * Whether a class is a command. A subclass of a command is not one unless it
 * is decorated itself.
 */
export function isCommand(target: unknown): target is ClassType {
  return typeof target === 'function' && Object.hasOwn(target, CommandMetadataKey)
}

/**
 * What `@Command` recorded about a class.
 * @throws when the class is not decorated with `@Command`
 */
export function getCommandMetadata(target: ClassType): CommandMetadata {
  if (!isCommand(target)) {
    const name = typeof target === 'function' ? (target as ClassType).name : String(target)
    throw new Error(
      `[Navios Commander] ${name} is not a command. Make sure it is decorated with @Command.`,
    )
  }
  return (target as unknown as Record<symbol, CommandMetadata>)[CommandMetadataKey]
}
