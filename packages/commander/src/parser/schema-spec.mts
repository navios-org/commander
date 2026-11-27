/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * How the text of an argument becomes a value:
 * - `boolean`: a flag that takes no value
 * - `number`, `bigint`, `string`: converted to that type
 * - `json`: parsed as JSON when it is JSON, for objects and tuples
 * - `auto`: guessed, when the schema does not say (`z.any()`, a union, no schema)
 */
export type ValueKind = 'boolean' | 'number' | 'bigint' | 'string' | 'json' | 'auto'

/** One option of a command, as its schema describes it. */
export interface OptionSpec {
  /** Where the value goes in the options object: `['config', 'port']`. */
  path: string[]
  /** The flag without dashes, in kebab case: `config.port`, `dry-run`. */
  flag: string
  kind: ValueKind
  /** The option may be given several times; `kind` is that of one value. */
  array: boolean
  required: boolean
  defaultValue?: unknown
  description?: string
  /** Other names: one letter for `-x`, more for `--name`. */
  aliases: string[]
  /** The values an enum or a union of literals allows. */
  choices?: string[]
  /** Left out of the help. */
  hidden: boolean
  /** An object whose fields are options too; it also takes JSON as a whole. */
  group: boolean
}

export interface SchemaSpec {
  options: OptionSpec[]
  /** Whether the schema could be read. Without that, every option is guessed. */
  known: boolean
  /** Whether options the schema does not list are let through. */
  allowUnknown: boolean
}

/** What `.meta()` may carry for an option. */
export interface OptionMeta {
  description?: string
  /** `'n'` for `-n`, `'target'` for `--target`, or several. */
  alias?: string | string[]
  /** Leave the option out of the help. */
  hidden?: boolean
}

const WRAPPERS = new Set([
  'optional',
  'nullable',
  'default',
  'prefault',
  'catch',
  'readonly',
  'nonoptional',
])

function defOf(schema: any): any {
  return schema?._zod?.def ?? schema?.def
}

function metaOf(schema: any): OptionMeta | undefined {
  try {
    const meta = typeof schema?.meta === 'function' ? schema.meta() : undefined
    if (meta && typeof meta === 'object') {
      return meta as OptionMeta
    }
    const description = schema?.description
    return typeof description === 'string' ? { description } : undefined
  } catch {
    return undefined
  }
}

interface Unwrapped {
  schema: any
  def: any
  required: boolean
  defaultValue: unknown
  meta: OptionMeta
}

/** Takes the wrappers off a field: `z.string().optional().default('x')`. */
function unwrap(schema: any): Unwrapped {
  let current = schema
  let required = true
  let defaultValue: unknown
  const meta: OptionMeta = {}
  for (let depth = 0; depth < 32; depth++) {
    // The outermost description and alias count: they are what the author wrote last.
    const own = metaOf(current)
    if (own) {
      meta.description ??= own.description
      meta.alias ??= own.alias
      meta.hidden ??= own.hidden
    }
    const def = defOf(current)
    const type = def?.type
    if (WRAPPERS.has(type)) {
      if (type === 'optional') {
        required = false
      } else if (type === 'nonoptional') {
        required = true
      } else if (type === 'default' || type === 'prefault') {
        required = false
        if (defaultValue === undefined) {
          const value = def.defaultValue
          defaultValue = typeof value === 'function' ? value() : value
        }
      } else if (type === 'catch') {
        required = false
      }
      current = def.innerType
      continue
    }
    if (type === 'pipe') {
      // The input side is what the command line has to produce.
      current = def.in
      continue
    }
    if (type === 'lazy' && typeof def.getter === 'function') {
      current = def.getter()
      continue
    }
    return { schema: current, def, required, defaultValue, meta }
  }
  return { schema: current, def: defOf(current), required, defaultValue, meta }
}

function literalChoices(def: any): string[] | undefined {
  if (def?.type === 'enum' && def.entries) {
    return Object.values(def.entries).map(String)
  }
  if (def?.type === 'literal' && Array.isArray(def.values)) {
    return def.values.map(String)
  }
  if (def?.type === 'union' && Array.isArray(def.options)) {
    const all: string[] = []
    for (const option of def.options) {
      const choices = literalChoices(unwrap(option).def)
      if (!choices) {
        return undefined
      }
      all.push(...choices)
    }
    return all
  }
  return undefined
}

function kindOf(def: any): ValueKind {
  switch (def?.type) {
    case 'boolean':
      return 'boolean'
    case 'number':
    case 'int':
      return 'number'
    case 'bigint':
      return 'bigint'
    case 'string':
    case 'enum':
    case 'template_literal':
    case 'date':
      return 'string'
    case 'literal': {
      const types = new Set((def.values as unknown[]).map((value) => typeof value))
      if (types.size !== 1) {
        return 'auto'
      }
      const [only] = types
      return only === 'boolean' || only === 'number' || only === 'bigint' || only === 'string'
        ? only
        : 'auto'
    }
    case 'union': {
      const kinds = new Set<ValueKind>(
        (def.options as unknown[]).map((option) => kindOf(unwrap(option).def)),
      )
      return kinds.size === 1 ? [...kinds][0] : 'auto'
    }
    case 'object':
    case 'record':
    case 'map':
    case 'tuple':
      return 'json'
    default:
      return 'auto'
  }
}

export function kebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function camelCase(name: string): string {
  return name.replace(/-+([a-zA-Z0-9])/g, (_, letter: string) => letter.toUpperCase())
}

function aliasesOf(meta: OptionMeta): string[] {
  const { alias } = meta
  if (alias === undefined) {
    return []
  }
  return (Array.isArray(alias) ? alias : [alias]).filter(
    (name): name is string => typeof name === 'string' && name.length > 0,
  )
}

function collect(shape: Record<string, unknown>, parent: string[], into: OptionSpec[]): void {
  for (const [key, field] of Object.entries(shape)) {
    const { def, required, defaultValue, meta } = unwrap(field)
    const path = [...parent, key]
    let kind = kindOf(def)
    let array = false
    let valueDef = def
    if (def?.type === 'array' || def?.type === 'set') {
      array = true
      valueDef = unwrap(def.element ?? def.valueType).def
      kind = kindOf(valueDef)
    }
    const nested = def?.type === 'object' && def.shape && typeof def.shape === 'object'
    into.push({
      path,
      flag: path.map(kebabCase).join('.'),
      kind,
      array,
      required,
      defaultValue,
      description: meta.description,
      aliases: aliasesOf(meta),
      choices: literalChoices(valueDef),
      hidden: meta.hidden === true,
      group: Boolean(nested),
    })
    if (nested) {
      collect(def.shape, path, into)
    }
  }
}

/**
 * Reads what a schema says about the options of a command. Schemas of zod 4
 * (and `zod/mini`) are understood; for any other Standard Schema nothing is
 * known, and the command line is parsed by guessing.
 */
export function describeSchema(schema: unknown): SchemaSpec {
  if (schema === undefined || schema === null) {
    return { options: [], known: false, allowUnknown: true }
  }
  try {
    const { def } = unwrap(schema)
    if (def?.type !== 'object' || !def.shape || typeof def.shape !== 'object') {
      return { options: [], known: false, allowUnknown: true }
    }
    const options: OptionSpec[] = []
    collect(def.shape, [], options)
    // `z.object()` drops unknown keys without a word, which hides typos, so
    // they are refused unless the schema asks for them: `z.looseObject()`.
    const catchall = defOf(def.catchall)?.type
    return { options, known: true, allowUnknown: catchall !== undefined && catchall !== 'never' }
  } catch {
    return { options: [], known: false, allowUnknown: true }
  }
}
