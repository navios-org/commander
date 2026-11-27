/** A positional argument that a command path declares. */
export interface CommandParam {
  /** The key in the options object, as written in the path. */
  name: string
  required: boolean
  /** Takes every argument that is left. */
  variadic: boolean
}

export interface ParsedCommandPath {
  /** The words that select the command: `['db', 'migrate']`. */
  words: string[]
  params: CommandParam[]
}

const WORD = /^[A-Za-z0-9][\w:.-]*$/
const PARAM = /^(?:<(\.\.\.)?([A-Za-z_$][\w$]*)>|\[(\.\.\.)?([A-Za-z_$][\w$]*)\])$/

/**
 * Reads a command path: the words that select the command, then the
 * positional arguments it takes.
 *
 * ```
 * db migrate                     two words, no arguments
 * deploy <env>                   one required argument
 * copy <source> [target]         a required and an optional one
 * lint [...files]                any number of arguments
 * ```
 *
 * @throws for a path that cannot be parsed unambiguously
 */
export function parseCommandPath(path: string): ParsedCommandPath {
  const words: string[] = []
  const params: CommandParam[] = []
  const fail = (reason: string): never => {
    throw new Error(`[Navios Commander] Invalid command path "${path}": ${reason}`)
  }
  for (const part of path.trim().split(/\s+/)) {
    if (part === '') {
      continue
    }
    const match = PARAM.exec(part)
    if (!match) {
      if (!WORD.test(part)) {
        fail(`"${part}" is neither a word nor an argument such as <name>, [name] or [...names]`)
      }
      if (params.length > 0) {
        fail(`the word "${part}" comes after an argument`)
      }
      words.push(part)
      continue
    }
    const required = match[2] !== undefined
    const name = match[2] ?? match[4]
    const variadic = (match[1] ?? match[3]) !== undefined
    const last = params.at(-1)
    if (last?.variadic) {
      fail(`"${part}" comes after the variadic argument "${last.name}", which takes the rest`)
    }
    if (required && last && !last.required) {
      fail(`the required argument "${name}" comes after the optional "${last.name}"`)
    }
    if (params.some((param) => param.name === name)) {
      fail(`the argument "${name}" is declared twice`)
    }
    params.push({ name, required, variadic })
  }
  if (words.length === 0) {
    fail('it has no command word')
  }
  return { words, params }
}

/** How an argument is written in usage lines. */
export function formatParam(param: CommandParam): string {
  const name = param.variadic ? `...${param.name}` : param.name
  return param.required ? `<${name}>` : `[${name}]`
}
