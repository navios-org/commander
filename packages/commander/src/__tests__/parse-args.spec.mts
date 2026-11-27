import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'

import { CliUsageError } from '../errors.mjs'
import { parseCommandPath } from '../parser/command-path.mjs'
import { assignParams, compileArgsSpec, parseArgs } from '../parser/parse-args.mjs'
import { describeSchema } from '../parser/schema-spec.mjs'

function parse(args: string[], schema?: z.ZodType, path = 'cmd') {
  const { words, params } = parseCommandPath(path)
  const spec = compileArgsSpec(words.join(' '), describeSchema(schema), params)
  const parsed = parseArgs(args, spec)
  assignParams(parsed, spec)
  return parsed
}

describe('parseArgs with a zod schema', () => {
  const schema = z.object({
    name: z.string().optional(),
    port: z.number().default(3000),
    verbose: z.boolean().default(false).meta({ alias: 'v' }),
    color: z.boolean().default(true),
    dryRun: z
      .boolean()
      .optional()
      .meta({ alias: ['n', 'simulate'] }),
    tags: z.array(z.string()).default([]).meta({ alias: 't' }),
    level: z.enum(['low', 'high']).optional(),
    offset: z.number().optional(),
    config: z.object({ host: z.string(), port: z.number(), tls: z.boolean() }).partial().optional(),
  })

  it('keeps a string that looks like a number a string', () => {
    expect(parse(['--name', '123'], schema).options).toEqual({ name: '123' })
    expect(parse(['--name=true'], schema).options).toEqual({ name: 'true' })
  })

  it('converts numbers, negative ones included', () => {
    expect(parse(['--port', '8080', '--offset', '-5'], schema).options).toEqual({
      port: 8080,
      offset: -5,
    })
    expect(parse(['--offset=-0.5'], schema).options).toEqual({ offset: -0.5 })
  })

  it('leaves text that is not a number for the schema to refuse', () => {
    expect(parse(['--port', 'abc'], schema).options).toEqual({ port: 'abc' })
  })

  it('does not let a boolean flag take the next argument', () => {
    const parsed = parse(['--verbose', 'a.txt'], schema, 'cmd <file>')
    expect(parsed.options).toEqual({ verbose: true, file: 'a.txt' })
  })

  it('understands --no-flag, --flag=false and kebab or camel case', () => {
    expect(parse(['--no-color'], schema).options).toEqual({ color: false })
    expect(parse(['--color=false'], schema).options).toEqual({ color: false })
    expect(parse(['--dry-run'], schema).options).toEqual({ dryRun: true })
    expect(parse(['--dryRun'], schema).options).toEqual({ dryRun: true })
  })

  it('resolves aliases, short and long', () => {
    expect(parse(['-v', '-n'], schema).options).toEqual({ verbose: true, dryRun: true })
    expect(parse(['-vn'], schema).options).toEqual({ verbose: true, dryRun: true })
    expect(parse(['--simulate'], schema).options).toEqual({ dryRun: true })
  })

  it('lets the last letter of a group take a value', () => {
    expect(parse(['-vt', 'a', '-tb', '-t=c'], schema).options).toEqual({
      verbose: true,
      tags: ['a', 'b', 'c'],
    })
  })

  it('collects repeated options and a JSON list', () => {
    expect(parse(['--tags', 'a', '--tags=b'], schema).options).toEqual({ tags: ['a', 'b'] })
    expect(parse(['--tags', '["a","b"]'], schema).options).toEqual({ tags: ['a', 'b'] })
  })

  it('fills the fields of an object', () => {
    expect(
      parse(['--config.host', 'localhost', '--config.port=80', '--config.tls'], schema).options,
    ).toEqual({ config: { host: 'localhost', port: 80, tls: true } })
    expect(parse(['--config', '{"host":"h"}'], schema).options).toEqual({ config: { host: 'h' } })
  })

  it('stops reading options at --', () => {
    const parsed = parse(['--verbose', '--', '--name', '-x'], schema, 'cmd [...rest]')
    expect(parsed.options).toEqual({ verbose: true, rest: ['--name', '-x'] })
  })

  it('refuses an unknown option and suggests the nearest', () => {
    expect(() => parse(['--nmae', 'x'], schema)).toThrow(
      new CliUsageError('Unknown option --nmae. Did you mean --name?', 'cmd'),
    )
    expect(() => parse(['-x'], schema)).toThrow('Unknown option -x')
  })

  it('refuses an option without its value', () => {
    expect(() => parse(['--name'], schema)).toThrow('Option --name needs a value')
    expect(() => parse(['--name', '--verbose'], schema)).toThrow('Option --name needs a value')
  })

  it('accepts a value that starts with a dash when it is no option', () => {
    expect(parse(['--name', '-anything'], schema).options).toEqual({ name: '-anything' })
  })

  it('reports --help and -h unless the command has such an option', () => {
    expect(parse(['--help'], schema).help).toBe(true)
    expect(parse(['-h'], schema).help).toBe(true)
    const own = z.object({ host: z.string().meta({ alias: 'h' }) })
    expect(parse(['-h', 'localhost'], own)).toMatchObject({
      help: false,
      options: { host: 'localhost' },
    })
  })

  it('lets unknown options through for a loose object', () => {
    const loose = z.looseObject({ name: z.string() })
    expect(parse(['--name', 'a', '--extra', '1', '--flag'], loose).options).toEqual({
      name: 'a',
      extra: 1,
      flag: true,
    })
  })

  it('sees through optional, default, nullable and pipes', () => {
    const wrapped = z.object({
      dry: z.boolean().nullable().optional(),
      count: z.coerce.number().default(1),
      when: z
        .string()
        .transform((value) => new Date(value))
        .optional(),
    })
    expect(parse(['--dry', '--count', '5', '--when', '2026'], wrapped).options).toEqual({
      dry: true,
      count: 5,
      when: '2026',
    })
  })

  it('rejects two options with one alias', () => {
    const clash = z.object({
      a: z.boolean().meta({ alias: 'x' }),
      b: z.boolean().meta({ alias: 'x' }),
    })
    expect(() => parse([], clash)).toThrow('the alias "x" is used by both --a and --b')
  })
})

describe('parseArgs without a schema', () => {
  it('guesses types', () => {
    expect(
      parse(['--name', 'x', '--count', '3', '--flag', '-ab', '--json', '{"a":1}']).options,
    ).toEqual({
      name: 'x',
      count: 3,
      flag: true,
      a: true,
      b: true,
      json: { a: 1 },
    })
  })

  it('never writes to the prototype of objects', () => {
    for (const flag of [
      '--__proto__.polluted=1',
      '--constructor.prototype.polluted=1',
      '--a.__proto__.polluted=1',
    ]) {
      expect(() => parse([flag])).toThrow(CliUsageError)
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('turns a repeated option into a list', () => {
    expect(parse(['--tag', 'a', '--tag', 'b']).options).toEqual({ tag: ['a', 'b'] })
  })
})

describe('positional arguments', () => {
  const schema = z.object({
    source: z.string(),
    target: z.string().optional(),
    count: z.number().optional(),
    files: z.array(z.string()).default([]),
    force: z.boolean().default(false),
  })

  it('assigns them by name, before and after options', () => {
    expect(parse(['a.txt', '--force', 'b.txt'], schema, 'copy <source> [target]').options).toEqual({
      source: 'a.txt',
      force: true,
      target: 'b.txt',
    })
  })

  it('converts them as the schema says', () => {
    expect(parse(['x', '5'], schema, 'cmd <source> <count>').options).toEqual({
      source: 'x',
      count: 5,
    })
    expect(parse(['x', '-5'], schema, 'cmd <source> <count>').options).toEqual({
      source: 'x',
      count: -5,
    })
  })

  it('gives the rest to a variadic one', () => {
    expect(parse(['s', 'a', 'b'], schema, 'cmd <source> [...files]').options).toEqual({
      source: 's',
      files: ['a', 'b'],
    })
    expect(parse(['s'], schema, 'cmd <source> [...files]').options).toEqual({ source: 's' })
  })

  it('reports a missing and a superfluous one', () => {
    expect(() => parse([], schema, 'copy <source>')).toThrow('Missing argument <source>')
    expect(() => parse([], schema, 'lint <...files>')).toThrow('Missing argument <...files>')
    expect(() => parse(['a', 'b', 'c'], schema, 'copy <source>')).toThrow(
      'Unexpected arguments: b c',
    )
  })
})

describe('parseCommandPath', () => {
  it('reads words and arguments', () => {
    expect(parseCommandPath('db migrate <name> [...rest]')).toEqual({
      words: ['db', 'migrate'],
      params: [
        { name: 'name', required: true, variadic: false },
        { name: 'rest', required: false, variadic: true },
      ],
    })
  })

  it.each([
    ['', 'it has no command word'],
    ['<a>', 'it has no command word'],
    ['cmd <a> word', 'comes after an argument'],
    ['cmd [a] <b>', 'comes after the optional'],
    ['cmd [...a] [b]', 'comes after the variadic'],
    ['cmd <a> [a]', 'declared twice'],
    ['cmd <a', 'neither a word nor an argument'],
  ])('refuses %j', (path, reason) => {
    expect(() => parseCommandPath(path)).toThrow(reason)
  })
})
