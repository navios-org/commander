/**
 * `@Command` for projects that keep `experimentalDecorators: true`.
 * Everything else comes from `@navios/commander`, and works with both.
 *
 * ```ts
 * import { runCli } from '@navios/commander'
 * import { Command } from '@navios/commander/legacy-compat'
 * ```
 */
import { legacy } from '@navios/core/legacy-compat'

import type { ClassType, StandardSchemaV1 } from '@navios/core'

import { Command as StandardCommand } from '../command/command.mjs'

import type { CommandDefinition } from '../command/command.mjs'

// Adds `commands` to the options of `@Module`.
import '../transport/cli-transport.mjs'

export type { CommandDefinition } from '../command/command.mjs'

/** `@Command` for legacy decorators: makes a class a command, and injectable. */
export function Command<Schema extends StandardSchemaV1 | undefined = undefined>(
  definition: CommandDefinition<Schema>,
) {
  return legacy(StandardCommand(definition) as never) as <T extends ClassType>(target: T) => T
}
