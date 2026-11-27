import { CliUsageError } from '../errors.mjs'

import { formatParam } from './command-path.mjs'
import { camelCase } from './schema-spec.mjs'
import { closest } from './suggest.mjs'

import type { CommandParam } from './command-path.mjs'
import type { OptionSpec, SchemaSpec, ValueKind } from './schema-spec.mjs'

/** Everything the parser needs to know about one command, computed once. */
export interface ArgsSpec {
  /** The command, for error messages. */
  command: string
  schema: SchemaSpec
  params: CommandParam[]
  /** Options by every name that follows `--`. */
  long: Map<string, OptionSpec>
  /** Options by the letter that follows `-`. */
  short: Map<string, OptionSpec>
}

export interface ParsedArgs {
  options: Record<string, unknown>
  /** The arguments that are not options, in order. */
  positionals: string[]
  /** `--help` or `-h` was given, and the command has no option of that name. */
  help: boolean
}

export function compileArgsSpec(
  command: string,
  schema: SchemaSpec,
  params: CommandParam[],
): ArgsSpec {
  const long = new Map<string, OptionSpec>()
  const short = new Map<string, OptionSpec>()
  for (const option of schema.options) {
    long.set(option.flag, option)
    long.set(option.path.join('.'), option)
    for (const alias of option.aliases) {
      const names = alias.length === 1 ? short : long
      const taken = names.get(alias)
      if (taken && taken !== option) {
        throw new Error(
          `[Navios Commander] Command "${command}": the alias "${alias}" is used by both ` +
            `--${taken.flag} and --${option.flag}.`,
        )
      }
      names.set(alias, option)
    }
  }
  return { command, schema, params, long, short }
}

// Assigning to these would reach the prototype of every object.
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor'])

const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i

function auto(text: string): unknown {
  if (text === 'true') {
    return true
  }
  if (text === 'false') {
    return false
  }
  if (NUMBER.test(text)) {
    return Number(text)
  }
  return json(text)
}

function json(text: string): unknown {
  const first = text[0]
  if (first === '{' || first === '[') {
    try {
      return JSON.parse(text)
    } catch {
      // Not JSON after all.
    }
  }
  return text
}

const TRUE = new Set(['true', '1', 'yes', 'on'])
const FALSE = new Set(['false', '0', 'no', 'off'])

/**
 * Text that does not fit the type is left as it is: the schema then says
 * what is wrong with it, in its own words.
 */
function convert(text: string, kind: ValueKind): unknown {
  switch (kind) {
    case 'string':
      return text
    case 'number':
      return NUMBER.test(text) ? Number(text) : text
    case 'bigint':
      try {
        return BigInt(text)
      } catch {
        return text
      }
    case 'boolean': {
      const lower = text.toLowerCase()
      return TRUE.has(lower) ? true : FALSE.has(lower) ? false : text
    }
    case 'json':
      return json(text)
    default:
      return auto(text)
  }
}

function slot(options: Record<string, unknown>, path: string[]): Record<string, unknown> {
  let current = options
  for (let i = 0; i < path.length - 1; i++) {
    const next = current[path[i]]
    if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
      current = next as Record<string, unknown>
    } else {
      current = current[path[i]] = {}
    }
  }
  return current
}

function assign(options: Record<string, unknown>, option: OptionSpec, value: unknown): void {
  const target = slot(options, option.path)
  const key = option.path[option.path.length - 1]
  if (!option.array) {
    target[key] = value
    return
  }
  const list = Array.isArray(target[key]) ? (target[key] as unknown[]) : (target[key] = [])
  if (Array.isArray(value)) {
    list.push(...value)
  } else {
    list.push(value)
  }
}

function value(text: string, option: OptionSpec): unknown {
  if (option.array && text[0] === '[') {
    // The whole list at once: --tags '["a","b"]'
    const parsed = json(text)
    if (Array.isArray(parsed)) {
      return parsed
    }
  }
  return convert(text, option.kind)
}

/** An option the schema does not list, where that is allowed: its type is guessed. */
function assignUnknown(options: Record<string, unknown>, path: string[], value: unknown): void {
  const target = slot(options, path)
  const key = path[path.length - 1]
  if (!Object.hasOwn(target, key)) {
    target[key] = value
  } else if (Array.isArray(target[key])) {
    // Given again: the values add up.
    ;(target[key] as unknown[]).push(value)
  } else {
    target[key] = [target[key], value]
  }
}

/**
 * Turns the arguments that follow a command into its options.
 *
 * - `--name value`, `--name=value`, `-n value`, `-nvalue`, `-n=value`
 * - `--flag` and `--no-flag` for booleans, `-abc` for several one-letter flags
 * - `--config.port 80` for a field of an object, `--config '{"port":80}'` for all of it
 * - an option that takes a list may be repeated
 * - `--` ends the options: everything after it is an argument
 *
 * What a value becomes is decided by the schema, not by how it looks:
 * `--name 123` stays the string `'123'` for `z.string()`.
 *
 * @throws CliUsageError for an option the schema does not have, or one without its value
 */
export function parseArgs(args: readonly string[], spec: ArgsSpec): ParsedArgs {
  const { long, short, schema, command } = spec
  const options: Record<string, unknown> = {}
  const positionals: string[] = []
  let help = false

  const unknown = (written: string, name: string): never => {
    const near = closest(name, long.keys())
    throw new CliUsageError(
      `Unknown option ${written}` + (near ? `. Did you mean --${near}?` : ''),
      command,
    )
  }

  /** Whether an argument is an option rather than a value that starts with a dash. */
  const isOption = (arg: string): boolean => {
    if (arg.length < 2 || arg[0] !== '-') {
      return false
    }
    if (arg === '--') {
      return true
    }
    if (arg[1] === '-') {
      const name = arg.slice(2).split('=', 1)[0]
      return (
        !schema.known ||
        long.has(name) ||
        name === 'help' ||
        (name.startsWith('no-') && long.has(name.slice(3)))
      )
    }
    return !NUMBER.test(arg) && (!schema.known || short.has(arg[1]) || arg[1] === 'h')
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--') {
      positionals.push(...args.slice(i + 1))
      break
    }

    /** The value of the option that is being read: given inline, or the next argument. */
    const take = (written: string, option: OptionSpec, inline: string | undefined): string => {
      if (inline !== undefined) {
        return inline
      }
      const next = args[i + 1]
      if (
        next === undefined ||
        (isOption(next) && !(option.kind === 'number' && NUMBER.test(next)))
      ) {
        throw new CliUsageError(`Option ${written} needs a value`, command)
      }
      i++
      return next
    }

    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq)
      const inline = eq === -1 ? undefined : arg.slice(eq + 1)
      const written = `--${name}`
      const option = long.get(name)

      if (option) {
        if (option.kind === 'boolean' && !option.array) {
          assign(options, option, inline === undefined ? true : convert(inline, 'boolean'))
        } else {
          assign(options, option, value(take(written, option, inline), option))
        }
        continue
      }
      if (name === 'help') {
        help = true
        continue
      }
      const negated = name.startsWith('no-') ? long.get(name.slice(3)) : undefined
      if (negated && negated.kind === 'boolean' && !negated.array && inline === undefined) {
        assign(options, negated, false)
        continue
      }
      if (!schema.allowUnknown) {
        unknown(written, name)
      }
      const negative = name.startsWith('no-') && inline === undefined
      const path = (negative ? name.slice(3) : name).split('.').map(camelCase)
      if (path.some((part) => part === '' || FORBIDDEN.has(part))) {
        throw new CliUsageError(`Invalid option ${written}`, command)
      }
      if (negative) {
        assignUnknown(options, path, false)
      } else if (inline !== undefined) {
        assignUnknown(options, path, auto(inline))
      } else if (args[i + 1] !== undefined && !isOption(args[i + 1])) {
        assignUnknown(options, path, auto(args[++i]))
      } else {
        assignUnknown(options, path, true)
      }
      continue
    }

    if (arg.length > 1 && arg[0] === '-' && !(NUMBER.test(arg) && !short.has(arg[1]))) {
      // One letter each: -v, -abc, -n 5, -n5, -n=5
      for (let j = 1; j < arg.length; j++) {
        const letter = arg[j]
        const written = `-${letter}`
        const option = short.get(letter)
        const rest = arg.slice(j + 1)
        const inline = rest === '' ? undefined : rest[0] === '=' ? rest.slice(1) : rest

        if (option) {
          if (option.kind === 'boolean' && !option.array) {
            if (rest[0] === '=') {
              assign(options, option, convert(rest.slice(1), 'boolean'))
              break
            }
            assign(options, option, true)
            continue
          }
          assign(options, option, value(take(written, option, inline), option))
          break
        }
        if (letter === 'h') {
          help = true
          continue
        }
        if (!schema.allowUnknown || FORBIDDEN.has(letter) || !/[A-Za-z0-9]/.test(letter)) {
          unknown(written, letter)
        }
        if (rest[0] === '=') {
          assignUnknown(options, [letter], auto(rest.slice(1)))
          break
        }
        if (rest === '' && args[i + 1] !== undefined && !isOption(args[i + 1])) {
          assignUnknown(options, [letter], auto(args[++i]))
        } else {
          assignUnknown(options, [letter], true)
        }
      }
      continue
    }

    positionals.push(arg)
  }

  return { options, positionals, help }
}

/**
 * Gives the arguments of a command line to the arguments its path declares,
 * under their names in the options object.
 *
 * @throws CliUsageError when a required one is missing or one is left over
 */
export function assignParams(parsed: ParsedArgs, spec: ArgsSpec): void {
  const { params, long, command } = spec
  const rest = [...parsed.positionals]
  for (const param of params) {
    const option = long.get(param.name)
    const kind = option?.kind ?? (spec.schema.known ? 'string' : 'auto')
    if (param.variadic) {
      if (rest.length === 0) {
        if (param.required) {
          throw new CliUsageError(`Missing argument ${formatParam(param)}`, command)
        }
        continue
      }
      parsed.options[param.name] = rest.splice(0).map((text) => convert(text, kind))
      continue
    }
    const text = rest.shift()
    if (text === undefined) {
      if (param.required && !Object.hasOwn(parsed.options, param.name)) {
        throw new CliUsageError(`Missing argument ${formatParam(param)}`, command)
      }
      continue
    }
    const converted = convert(text, kind)
    parsed.options[param.name] = option?.array ? [converted] : converted
  }
  if (rest.length > 0) {
    throw new CliUsageError(
      `Unexpected argument${rest.length > 1 ? 's' : ''}: ${rest.join(' ')}`,
      command,
    )
  }
}
