import { registerInjectable } from '@navios/core'
import { describeHandlerClass } from '@navios/core/transport'

import type {
  ClassType,
  GuardClass,
  InferOutput,
  InjectableScope,
  InterceptorClass,
  StandardSchemaV1,
} from '@navios/core'
import type { HandlerClassOptions } from '@navios/core/transport'

import { parseCommandPath } from '../parser/command-path.mjs'

import { defineCommandMetadata } from './command-metadata.mjs'

import type { CommandContext } from './command-context.mjs'

/**
 * What a command returns: nothing, or the exit code of the process.
 */
export type CommandResult = void | number

/**
 * A command. `execute` receives the validated options and the context of
 * the run.
 *
 * ```ts
 * const options = z.object({ name: z.string() })
 *
 * @Command({ path: 'greet', options })
 * class GreetCommand implements CommandHandler<typeof options> {
 *   execute({ name }: CommandOptions<typeof options>, ctx: CommandContext) {
 *     ctx.output.write(`Hello, ${name}!`)
 *   }
 * }
 * ```
 *
 * The type argument is the schema of the options, or the type of the
 * options themselves.
 */
export interface CommandHandler<Options = Record<string, unknown>> {
  execute(
    options: CommandOptions<Options>,
    ctx: CommandContext<CommandOptions<Options>>,
  ): CommandResult | Promise<CommandResult>
}

/** The options a schema produces; any other type is taken as it is. */
export type CommandOptions<Schema> = Schema extends StandardSchemaV1 ? InferOutput<Schema> : Schema

export interface CommandDefinition<Schema extends StandardSchemaV1 | undefined = undefined> {
  /**
   * The words that select the command, then the positional arguments it
   * takes: `'db migrate'`, `'deploy <env>'`, `'copy <source> [target]'`,
   * `'lint [...files]'`. An argument arrives in the options under its name.
   */
  path: string
  /** One line for command lists and the top of the command's help. */
  description?: string
  /**
   * The schema of the options, arguments included. A zod object also tells
   * the parser the type of each option and fills the help; any other
   * Standard Schema only validates.
   */
  options?: Schema
  /** Other words that select the command: `['d']`, `['db up']`. */
  aliases?: string[]
  /** Command lines for the help, without the name of the program. */
  examples?: string[]
  /** Leave the command out of command lists. It can still be run. */
  hidden?: boolean
  /** Guards that decide whether the command may run. */
  guards?: GuardClass[]
  /** Interceptors around the command, the first one outermost. */
  interceptors?: InterceptorClass[]
  /** Attribute values, for guards and interceptors to read. */
  attributes?: HandlerClassOptions['attributes']
  /**
   * The DI scope of the class. A command is a singleton by default; with
   * `InjectableScope.Request` every run gets its own instance.
   */
  scope?: InjectableScope
}

type HandlerClassFor<Schema> = abstract new (...args: never[]) => {
  execute(
    options: Schema extends StandardSchemaV1 ? InferOutput<Schema> : Record<string, unknown>,
    ctx: CommandContext<never>,
  ): CommandResult | Promise<CommandResult>
}

/**
 * Makes a class a command and registers it for dependency injection. List
 * it in the `commands` of a module.
 *
 * ```ts
 * const options = z.object({
 *   env: z.enum(['staging', 'production']),
 *   dryRun: z.boolean().default(false).meta({ alias: 'n', description: 'Change nothing' }),
 * })
 *
 * @Command({ path: 'deploy <env>', description: 'Deploy the application', options })
 * export class DeployCommand implements CommandHandler<typeof options> {
 *   private readonly deployer = inject(Deployer)
 *
 *   async execute({ env, dryRun }: CommandOptions<typeof options>) {
 *     await this.deployer.deploy(env, { dryRun })
 *   }
 * }
 * ```
 *
 * `execute` has to accept what the schema produces, which the compiler checks.
 */
export function Command<Schema extends StandardSchemaV1 | undefined = undefined>(
  definition: CommandDefinition<Schema>,
) {
  const { words, params } = parseCommandPath(definition.path)
  const aliases = (definition.aliases ?? []).map((alias) => {
    const parsed = parseCommandPath(alias)
    if (parsed.params.length > 0) {
      throw new Error(
        `[Navios Commander] The alias "${alias}" of "${definition.path}" declares arguments. ` +
          `An alias is only the words; the arguments are those of the path.`,
      )
    }
    return parsed.words.join(' ')
  })
  return <T extends HandlerClassFor<Schema>>(target: T, context: ClassDecoratorContext): T => {
    if (context.kind !== 'class') {
      throw new Error('[Navios Commander] @Command can only be used on classes.')
    }
    defineCommandMetadata(target as unknown as ClassType, {
      path: words.join(' '),
      words,
      params,
      aliases,
      description: definition.description,
      examples: definition.examples ?? [],
      hidden: definition.hidden ?? false,
      schema: definition.options,
      owner: describeHandlerClass(context, {
        guards: definition.guards,
        interceptors: definition.interceptors,
        attributes: definition.attributes,
      }),
    })
    registerInjectable(target as unknown as ClassType, { scope: definition.scope })
    return target
  }
}
