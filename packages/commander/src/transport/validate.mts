import type { StandardSchemaIssue, StandardSchemaV1 } from '@navios/core'

import { CliUsageError } from '../errors.mjs'
import { formatParam } from '../parser/command-path.mjs'
import { kebabCase } from '../parser/schema-spec.mjs'

import type { ArgsSpec } from '../parser/parse-args.mjs'

function keysOf(path: StandardSchemaIssue['path']): string[] {
  return (path ?? []).map((segment) =>
    String(typeof segment === 'object' && segment !== null ? segment.key : segment),
  )
}

function given(options: unknown, keys: string[]): boolean {
  let current = options
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || !Object.hasOwn(current, key)) {
      return false
    }
    current = (current as Record<string, unknown>)[key]
  }
  return current !== undefined
}

function describe(issue: StandardSchemaIssue, options: unknown, spec: ArgsSpec): string {
  const keys = keysOf(issue.path)
  if (keys.length === 0) {
    return issue.message
  }
  const param = keys.length === 1 ? spec.params.find((p) => p.name === keys[0]) : undefined
  const label = param ? formatParam(param) : `--${keys.map(kebabCase).join('.')}`
  if (!given(options, keys)) {
    return `Missing ${param ? 'argument' : 'option'} ${label}`
  }
  return `${label}: ${issue.message}`
}

/**
 * Validates the parsed options with the schema of the command and returns
 * what the schema makes of them.
 *
 * @throws CliUsageError that names the option or argument of every issue
 */
export async function validateOptions(
  schema: StandardSchemaV1 | undefined,
  options: Record<string, unknown>,
  spec: ArgsSpec,
): Promise<unknown> {
  if (schema === undefined) {
    return options
  }
  const result = await schema['~standard'].validate(options)
  if (!result.issues) {
    return result.value
  }
  const lines = Array.from(new Set(result.issues.map((issue) => describe(issue, options, spec))))
  throw new CliUsageError(
    lines.length === 1
      ? lines[0]
      : `The command line has ${lines.length} problems:${lines.map((line) => `\n  ${line}`).join('')}`,
    spec.command,
  )
}
