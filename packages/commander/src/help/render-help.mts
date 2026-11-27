import { formatParam } from '../parser/command-path.mjs'

import type { CommandParam } from '../parser/command-path.mjs'
import type { ArgsSpec } from '../parser/parse-args.mjs'
import type { OptionSpec } from '../parser/schema-spec.mjs'

/** What a command list shows of a command. */
export interface CommandSummary {
  path: string
  params: CommandParam[]
  aliases: string[]
  description?: string
  hidden: boolean
}

export interface ProgramInfo {
  /** The name the program is run with. */
  name: string
  description?: string
  version?: string
}

function table(rows: Array<[left: string, right: string]>): string[] {
  const width = Math.min(32, Math.max(...rows.map(([left]) => left.length)))
  return rows.map(([left, right]) => {
    if (right === '') {
      return `  ${left}`
    }
    // A long left column gets a line of its own, so the right one stays aligned.
    return left.length > width
      ? `  ${left}\n  ${' '.repeat(width)}  ${right}`
      : `  ${left.padEnd(width)}  ${right}`
  })
}

function usageOf(command: CommandSummary): string {
  return [command.path, ...command.params.map(formatParam)].join(' ')
}

/**
 * The commands of a program, or those below `group`: `db` lists `db migrate`
 * and `db seed`.
 */
export function renderCommandList(
  program: ProgramInfo,
  commands: readonly CommandSummary[],
  group?: string,
): string {
  const lines: string[] = []
  const prefix = group ? `${program.name} ${group}` : program.name
  lines.push(`Usage: ${prefix} <command> [options]`)
  if (!group && program.description) {
    lines.push('', program.description)
  }
  const visible = commands.filter((command) => !command.hidden)
  if (visible.length > 0) {
    lines.push('', 'Commands:')
    lines.push(...table(visible.map((command) => [usageOf(command), command.description ?? ''])))
  } else {
    lines.push('', 'No commands are registered.')
  }
  if (!group) {
    const globals: Array<[string, string]> = [['-h, --help', 'Show help']]
    if (program.version !== undefined) {
      globals.push(['-V, --version', 'Show the version'])
    }
    lines.push('', 'Options:', ...table(globals))
  }
  lines.push('', `Run "${program.name} <command> --help" for the options of a command.`)
  return lines.join('\n')
}

function placeholder(option: OptionSpec): string {
  if (option.kind === 'boolean' && !option.array) {
    return ''
  }
  if (option.choices && option.choices.length <= 6) {
    return ` <${option.choices.join('|')}>`
  }
  const name = option.kind === 'auto' ? 'value' : option.kind
  return option.array ? ` <${name}...>` : ` <${name}>`
}

function describeOption(option: OptionSpec): string {
  const notes: string[] = []
  if (option.choices && option.choices.length > 6) {
    notes.push(`one of: ${option.choices.join(', ')}`)
  }
  if (option.array) {
    notes.push('repeatable')
  }
  if (option.kind === 'boolean' && option.defaultValue !== undefined && !option.array) {
    // The flag itself tells: --flag switches on, --no-flag off.
  } else if (option.defaultValue !== undefined) {
    const shown =
      typeof option.defaultValue === 'string'
        ? option.defaultValue
        : JSON.stringify(option.defaultValue)
    if (shown !== undefined && shown !== '' && shown !== '[]' && shown !== '{}') {
      notes.push(`default: ${shown}`)
    }
  } else if (option.required && !option.group) {
    notes.push('required')
  }
  const suffix = notes.length > 0 ? `(${notes.join(', ')})` : ''
  return [option.description, suffix].filter(Boolean).join(' ')
}

function optionRow(option: OptionSpec): [string, string] {
  const short = option.aliases.find((alias) => alias.length === 1)
  const long = [option.flag, ...option.aliases.filter((alias) => alias.length > 1)]
    .map((name) => `--${name}`)
    .join(', ')
  // A boolean that is on by default is only ever switched off.
  const negatable = option.kind === 'boolean' && option.defaultValue === true && !option.array
  const flags = negatable ? long.replace(`--${option.flag}`, `--no-${option.flag}`) : long
  return [`${short ? `-${short}, ` : '    '}${flags}${placeholder(option)}`, describeOption(option)]
}

/** The help of one command: usage, arguments, options and examples. */
export function renderCommandHelp(
  program: ProgramInfo,
  command: CommandSummary & { examples: string[] },
  spec: ArgsSpec,
): string {
  const lines: string[] = []
  const params = new Map(command.params.map((param) => [param.name, param]))
  const options = spec.schema.options.filter(
    (option) => !option.hidden && !(option.path.length === 1 && params.has(option.path[0])),
  )
  const takesOptions = options.length > 0 || !spec.schema.known
  lines.push(`Usage: ${program.name} ${usageOf(command)}${takesOptions ? ' [options]' : ''}`)
  if (command.description) {
    lines.push('', command.description)
  }
  if (command.aliases.length > 0) {
    lines.push('', `Aliases: ${command.aliases.join(', ')}`)
  }
  if (command.params.length > 0) {
    lines.push('', 'Arguments:')
    lines.push(
      ...table(
        command.params.map((param) => {
          const option = spec.long.get(param.name)
          const notes = option ? describeOption({ ...option, array: false, required: false }) : ''
          const choices =
            option?.choices && option.choices.length <= 6 ? option.choices.join(' | ') : ''
          return [formatParam(param), [notes, choices && `(${choices})`].filter(Boolean).join(' ')]
        }),
      ),
    )
  }
  lines.push('', 'Options:')
  lines.push(...table([...options.map(optionRow), ['-h, --help', 'Show help']]))
  if (command.examples.length > 0) {
    lines.push('', 'Examples:')
    lines.push(...command.examples.map((example) => `  ${program.name} ${example}`))
  }
  return lines.join('\n')
}
