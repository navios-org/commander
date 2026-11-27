---
title: Arguments and options
---

# Arguments and options

The `options` of a command is one schema for everything the command line can carry. Commander reads the schema to decide how to parse, and then validates the result with it.

```ts
const options = z.object({
  name: z.string(),
  port: z.number().default(3000),
  verbose: z.boolean().default(false),
})

@Command({ path: 'serve', options })
```

## What a value becomes

The type of a value is decided by the schema, not by how the value looks.

| Schema | Command line | Value |
| --- | --- | --- |
| `z.string()` | `--name 123` | `'123'` |
| `z.number()` | `--port 8080`, `--offset -5` | `8080`, `-5` |
| `z.boolean()` | `--verbose` | `true` |
| `z.boolean()` | `--no-color`, `--color=false` | `false` |
| `z.enum(['a', 'b'])` | `--mode a` | `'a'` |
| `z.array(z.string())` | `--tag a --tag b` | `['a', 'b']` |
| `z.object({ ... })` | `--db.host localhost` | `{ host: 'localhost' }` |
| `z.bigint()` | `--id 9007199254740993` | `9007199254740993n` |

A value that does not fit its type is left as text, and the schema reports it in its own words:

```console
$ mycli serve --port abc
mycli: --port: Invalid input: expected number, received string
Run "mycli serve --help" for usage.
```

`optional()`, `default()`, `nullable()` and transforms are seen through: `z.coerce.number().default(1)` is still a number option.

## Ways to write an option

```console
--name value      --name=value
-n value          -nvalue          -n=value
--dry-run         --dryRun                     kebab case and camel case are the same option
--no-color                                     a boolean, switched off
-abc                                           the flags -a, -b and -c
-vn 5                                          the flag -v, then -n with the value 5
--                                             everything after it is an argument, not an option
```

A boolean never takes the next argument: in `mycli copy --force a.txt`, `a.txt` is an argument.

An option that needs a value and gets none is an error, and so is one that is followed by another option:

```console
$ mycli serve --name --verbose
mycli: Option --name needs a value
```

A value may start with a dash when it cannot be mistaken for an option: `--offset -5`, `--grep -foo`.

## Descriptions, aliases and defaults

Describe an option with `.meta()` of zod. The help shows the description, the default and the choices.

```ts
const options = z.object({
  target: z
    .enum(['development', 'production'])
    .default('development')
    .meta({ alias: 't', description: 'What to build for' }),
  minify: z.boolean().default(false).meta({ description: 'Minify the output' }),
  secret: z.string().optional().meta({ hidden: true }),
})
```

| Key of `.meta()` | Meaning |
| --- | --- |
| `description` | Shown in the help. `.describe('...')` does the same. |
| `alias` | One letter for `-t`, a word for `--target-env`, or an array of them. |
| `hidden` | Leave the option out of the help. |

Two options that claim the same alias are an error the first time the command is used.

## Positional arguments

Declare them in the path, and give each a field of the same name in the schema:

```ts
const options = z.object({
  source: z.string(),
  target: z.string().default('.'),
  force: z.boolean().default(false),
})

@Command({ path: 'copy <source> [target]', options })
```

| In the path | Meaning |
| --- | --- |
| `<name>` | Required. |
| `[name]` | Optional. |
| `[...names]` | Any number, as an array. Must come last. |
| `<...names>` | One or more, as an array. Must come last. |

Arguments and options can be mixed in any order: `mycli copy a.txt --force b.txt`. An argument is converted like an option of its type, so `<count>` with `count: z.number()` arrives as a number.

A missing required argument, and an argument too many, are usage errors:

```console
$ mycli copy
mycli: Missing argument <source>

$ mycli copy a b c
mycli: Unexpected argument: c
```

## Lists

An array option is given once per value. A JSON list is accepted as well:

```console
$ mycli build --tag a --tag b
$ mycli build --tag '["a","b"]'
```

## Objects

The fields of an object are options of their own, written with a dot. The whole object can be given as JSON.

```ts
const options = z.object({
  db: z.object({ host: z.string(), port: z.number().default(5432), tls: z.boolean().default(false) }),
})
```

```console
$ mycli migrate --db.host localhost --db.port 5433 --db.tls
$ mycli migrate --db '{"host":"localhost"}'
```

## Unknown options

`z.object()` drops keys it does not know, which would hide typos. Commander therefore refuses an option the schema does not list, and suggests the nearest one:

```console
$ mycli serve --prot 80
mycli: Unknown option --prot. Did you mean --port?
```

To let unknown options through, say so in the schema with `z.looseObject({ ... })`. Their types are then guessed, as described next.

## Without a schema, or with another library

A command without `options` accepts anything. Types are guessed: `true` and `false` are booleans, numbers are numbers, `{...}` and `[...]` are parsed as JSON, an option that is given twice becomes a list, and an option without a value is `true`.

Any [Standard Schema](https://standardschema.dev) can be the `options`: valibot, arktype and others validate, and `CommandOptions<typeof schema>` is typed from them. Only schemas of zod 4 can be read for types, aliases and help, so with another library the command line is parsed by guessing and the help lists no options.

## The types

```ts
import type { CommandHandler, CommandOptions } from '@navios/commander'

type Options = CommandOptions<typeof options> // what the schema produces

class ServeCommand implements CommandHandler<typeof options> {
  execute(options: Options) {}
}
```

`CommandHandler` takes the schema, or the type of the options themselves: `CommandHandler<{ port: number }>`.
