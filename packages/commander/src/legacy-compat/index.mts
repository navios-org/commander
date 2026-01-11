/**
 * Legacy-compatible decorators for projects using TypeScript experimental decorators.
 *
 * These decorators wrap the Stage 3 decorator implementations and convert
 * the legacy decorator arguments to Stage 3 format internally.
 *
 * @example
 * ```typescript
 * import { Command, CliModule, CommandHandler } from '@navios/commander/legacy-compat'
 *
 * @Command({ path: 'greet' })
 * export class GreetCommand implements CommandHandler {
 *   async execute() {
 *     console.log('Hello!')
 *   }
 * }
 *
 * @CliModule({
 *   commands: [GreetCommand],
 * })
 * export class AppModule {}
 * ```
 *
 * @packageDocumentation
 */

// Export legacy-compatible decorators (commander-specific)
export * from './decorators/index.mjs'

// Re-export core/DI legacy-compat utilities for convenience
export * from '@navios/core/legacy-compat'
