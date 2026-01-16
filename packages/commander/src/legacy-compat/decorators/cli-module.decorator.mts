import { createClassContext } from '@navios/core/legacy-compat'

import type { ClassType } from '@navios/core'

import {
  CliModule as OriginalCliModule,
  type CliModuleOptions,
} from '../../decorators/cli-module.decorator.mjs'

export type { CliModuleOptions }

/**
 * Legacy-compatible CliModule decorator.
 *
 * Works with TypeScript experimental decorators (legacy API).
 *
 * @param options - CLI module configuration options
 * @returns A class decorator compatible with legacy decorator API
 *
 * @example
 * ```typescript
 * import { CliModule } from '@navios/commander/legacy-compat'
 * import { GreetCommand } from './greet.command'
 * import { UserModule } from './user.module'
 *
 * @CliModule({
 *   commands: [GreetCommand],
 *   imports: [UserModule]
 * })
 * export class AppModule {}
 * ```
 */
export function CliModule(
  options: CliModuleOptions = {
    commands: [],
    controllers: [],
    imports: [],
    guards: [],
    overrides: [],
  },
) {
  return function (target: ClassType) {
    const context = createClassContext(target)
    const originalDecorator = OriginalCliModule(options)
    return originalDecorator(target, context)
  }
}
