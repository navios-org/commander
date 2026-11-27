import { Module, provide } from '@navios/core'
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod/v4'

import { CliOutput, Command, runCli } from '../index.mjs'
import { Command as LegacyCommand } from '../legacy-compat/index.mjs'
import { createTestCli } from '../testing/index.mjs'

import type { CommandContext, CommandHandler, CommandOptions } from '../index.mjs'

function capture() {
  const out: string[] = []
  const err: string[] = []
  const output: CliOutput = { write: (t) => void out.push(t), error: (t) => void err.push(t) }
  return { out, err, providers: [provide(CliOutput, { value: output })] }
}

describe('runCli', () => {
  afterEach(() => {
    process.exitCode = undefined
  })

  it('runs the command, closes the application and sets the exit code', async () => {
    let destroyed = false
    @Command({ path: 'ping' })
    class PingCommand implements CommandHandler {
      execute(_options: unknown, ctx: CommandContext) {
        ctx.output.write('pong')
      }
      onServiceDestroy() {
        destroyed = true
      }
    }
    @Command({ path: 'bad' })
    class BadCommand implements CommandHandler {
      execute() {
        return 7
      }
    }
    @Module({ commands: [PingCommand, BadCommand] })
    class AppModule {}

    const io = capture()
    expect(
      await runCli(AppModule, { args: ['ping'], logger: false, providers: io.providers }),
    ).toBe(0)
    expect(io.out).toEqual(['pong'])
    expect(destroyed).toBe(true)
    expect(process.exitCode).toBe(0)

    expect(
      await runCli(AppModule, { args: ['bad'], logger: false, providers: capture().providers }),
    ).toBe(7)
    expect(process.exitCode).toBe(7)
    expect(process.listenerCount('SIGINT')).toBe(0)
  })

  it('returns 1 when the application cannot be built', async () => {
    class NotACommand {}
    @Module({ commands: [NotACommand] })
    class Broken {}
    const original = console.error
    const printed: unknown[] = []
    console.error = (...args: unknown[]) => void printed.push(...args)
    try {
      expect(await runCli(Broken, { args: ['x'], logger: false })).toBe(1)
    } finally {
      console.error = original
    }
    expect(String(printed[0])).toContain('is not decorated with @Command')
  })
})

describe('legacy decorators', () => {
  it('registers a command applied as a legacy decorator', async () => {
    class EchoCommand implements CommandHandler<{ text: string }> {
      execute(options: { text: string }, ctx: CommandContext) {
        ctx.output.write(options.text)
      }
    }
    LegacyCommand({ path: 'echo <text>', options: z.object({ text: z.string() }) })(EchoCommand)
    @Module({ commands: [EchoCommand] })
    class AppModule {}
    await using cli = await createTestCli(AppModule)
    expect((await cli.run('echo hi')).stdout).toBe('hi')
  })
})

describe('types', () => {
  it('infers the options of a schema and checks execute() against it', () => {
    const options = z.object({ count: z.number().default(1), name: z.string().optional() })
    expectTypeOf<CommandOptions<typeof options>>().toEqualTypeOf<{
      count: number
      name?: string | undefined
    }>()

    @Command({ path: 'ok', options })
    class Ok {
      execute(_options: { count: number }) {}
    }
    // @ts-expect-error execute() asks for an option the schema does not produce
    @Command({ path: 'wrong', options })
    class Wrong {
      execute(_options: { missing: string }) {}
    }
    expect([Ok, Wrong]).toHaveLength(2)
  })
})
