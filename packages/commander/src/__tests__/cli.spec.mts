import {
  AttributeFactory,
  createApplication,
  inject,
  Injectable,
  InjectableScope,
  Module,
  provide,
  UseGuards,
} from '@navios/core'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod/v4'

import type { ExecutionContext, Guard, Interceptor } from '@navios/core'

import {
  CliError,
  CliOutput,
  cliTransport,
  CliUsageError,
  Command,
  isCommandContext,
  lazyCommand,
} from '../index.mjs'
import { createTestCli } from '../testing/index.mjs'

import type { CommandContext, CommandHandler, CommandOptions } from '../index.mjs'

@Injectable()
class Greeter {
  greet(name: string, greeting: string) {
    return `${greeting}, ${name}!`
  }
}

const greetOptions = z.object({
  name: z.string().meta({ description: 'Who to greet' }),
  greeting: z.string().default('Hello').meta({ alias: 'g', description: 'The greeting' }),
  shout: z.boolean().default(false),
})

@Command({
  path: 'greet <name>',
  description: 'Greet someone',
  options: greetOptions,
  aliases: ['hi'],
  examples: ['greet World --shout'],
})
class GreetCommand implements CommandHandler<typeof greetOptions> {
  private readonly greeter = inject(Greeter)

  execute(options: CommandOptions<typeof greetOptions>, ctx: CommandContext) {
    const text = this.greeter.greet(options.name, options.greeting)
    ctx.output.write(options.shout ? text.toUpperCase() : text)
  }
}

@Command({ path: 'db migrate', description: 'Run migrations' })
class MigrateCommand implements CommandHandler {
  execute(_options: Record<string, unknown>, ctx: CommandContext) {
    ctx.output.write('migrated')
  }
}

@Command({ path: 'db seed', description: 'Seed data', hidden: true })
class SeedCommand implements CommandHandler {
  execute() {
    return 3
  }
}

@Command({ path: 'fail' })
class FailCommand implements CommandHandler<{ kind?: string }> {
  execute(options: { kind?: string }) {
    if (options.kind === 'cli') {
      throw new CliError('Nothing to deploy', { exitCode: 4 })
    }
    throw new TypeError('boom')
  }
}

@Module({ commands: [MigrateCommand, SeedCommand] })
class DbModule {}

@Module({ imports: [DbModule], commands: [GreetCommand, FailCommand] })
class AppModule {}

describe('running commands', () => {
  it('runs a command with options, an argument and an injected service', async () => {
    await using cli = await createTestCli(AppModule)
    expect(await cli.run('greet World')).toEqual({
      exitCode: 0,
      stdout: 'Hello, World!',
      stderr: '',
    })
    expect((await cli.run('greet World -g Hi --shout')).stdout).toBe('HI, WORLD!')
    expect((await cli.run(['greet', '--greeting=Good day', 'Ada Lovelace'])).stdout).toBe(
      'Good day, Ada Lovelace!',
    )
    expect((await cli.run('hi there')).stdout).toBe('Hello, there!')
  })

  it('finds a command of several words and uses a returned number as the exit code', async () => {
    await using cli = await createTestCli(AppModule)
    expect((await cli.run('db migrate')).stdout).toBe('migrated')
    expect((await cli.run('db seed')).exitCode).toBe(3)
  })

  it('reports a usage error with exit code 2 and a pointer to the help', async () => {
    await using cli = await createTestCli(AppModule, { name: 'mycli' })
    expect(await cli.run('greet')).toEqual({
      exitCode: 2,
      stdout: '',
      stderr: 'mycli: Missing argument <name>\nRun "mycli greet --help" for usage.',
    })
    expect((await cli.run('greet World --shuot')).stderr).toContain(
      'Unknown option --shuot. Did you mean --shout?',
    )
    expect((await cli.run('greet World extra')).stderr).toContain('Unexpected argument: extra')
    expect(await cli.run('gret World')).toEqual({
      exitCode: 2,
      stdout: '',
      stderr: 'mycli: Unknown command "gret". Did you mean "greet"?\nRun "mycli --help" for usage.',
    })
    expect((await cli.run('db migrte')).stderr).toContain(
      'Unknown command "db migrte". Did you mean "db migrate"?',
    )
    expect((await cli.run('--verbose')).stderr).toContain('Unknown option --verbose')
  })

  it('names the option of every validation issue', async () => {
    const options = z.object({
      port: z.number().max(65535),
      region: z.string(),
      mode: z.enum(['a', 'b']),
    })
    @Command({ path: 'serve', options })
    class ServeCommand implements CommandHandler<typeof options> {
      execute() {}
    }
    @Module({ commands: [ServeCommand] })
    class ServeModule {}
    await using cli = await createTestCli(ServeModule)
    const result = await cli.run('serve --port abc --mode c')
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('The command line has 3 problems:')
    expect(result.stderr).toContain('--port: Invalid input: expected number')
    expect(result.stderr).toContain('Missing option --region')
    expect(result.stderr).toMatch(/--mode: Invalid option/)
  })

  it('prints a CliError as it is and a crash with its stack', async () => {
    await using cli = await createTestCli(AppModule)
    expect(await cli.run('fail --kind cli')).toEqual({
      exitCode: 4,
      stdout: '',
      stderr: 'cli: Nothing to deploy',
    })
    const crash = await cli.run('fail')
    expect(crash.exitCode).toBe(1)
    expect(crash.stderr).toMatch(/^TypeError: boom\n\s+at /)
  })

  it('rejects from dispatch() instead of printing', async () => {
    await using cli = await createTestCli(AppModule)
    await expect(cli.transport.dispatch(['nope'])).rejects.toBeInstanceOf(CliUsageError)
    await expect(cli.transport.dispatch(['fail'])).rejects.toThrow('boom')
  })
})

describe('help', () => {
  it('lists the commands without arguments, with --help and with help', async () => {
    await using cli = await createTestCli(AppModule, {
      name: 'mycli',
      description: 'Does things',
      version: '1.2.3',
    })
    const expected = [
      'Usage: mycli <command> [options]',
      '',
      'Does things',
      '',
      'Commands:',
      '  db migrate        Run migrations',
      '  greet <name>      Greet someone',
      '  fail',
      '  help [...command]  Show help for a command',
      '',
      'Options:',
      '  -h, --help     Show help',
      '  -V, --version  Show the version',
      '',
      'Run "mycli <command> --help" for the options of a command.',
    ].join('\n')
    const listed = await cli.run('')
    expect(listed.exitCode).toBe(0)
    expect(listed.stdout.replace(/ +/g, ' ')).toBe(expected.replace(/ +/g, ' '))
    expect((await cli.run('--help')).stdout).toBe(listed.stdout)
    expect((await cli.run('help')).stdout).toBe(listed.stdout)
    expect((await cli.run('--version')).stdout).toBe('1.2.3')
  })

  it('describes a command from its schema', async () => {
    await using cli = await createTestCli(AppModule, { name: 'mycli' })
    const help = await cli.run('greet --help')
    expect(help.stdout).toBe(
      [
        'Usage: mycli greet <name> [options]',
        '',
        'Greet someone',
        '',
        'Aliases: hi',
        '',
        'Arguments:',
        '  <name>  Who to greet',
        '',
        'Options:',
        '  -g, --greeting <string>  The greeting (default: Hello)',
        '      --shout',
        '  -h, --help               Show help',
        '',
        'Examples:',
        '  mycli greet World --shout',
      ].join('\n'),
    )
    expect((await cli.run('help greet')).stdout).toBe(help.stdout)
    expect((await cli.run('greet -h')).stdout).toBe(help.stdout)
  })

  it('lists the commands of a group and hides hidden ones', async () => {
    await using cli = await createTestCli(AppModule, { name: 'mycli' })
    const group = await cli.run('db')
    expect(group.exitCode).toBe(0)
    expect(group.stdout).toContain('Usage: mycli db <command> [options]')
    expect(group.stdout).toContain('db migrate')
    expect(group.stdout).not.toContain('db seed')
    expect((await cli.run('help db')).stdout).toBe(group.stdout)
    expect((await cli.run('help nope')).exitCode).toBe(2)
  })
})

describe('guards, interceptors and scopes', () => {
  const Role = AttributeFactory.createAttribute(Symbol('Role'), z.string())

  it('runs guards and interceptors of the module and the command', async () => {
    const order: string[] = []

    @Injectable()
    class RoleGuard implements Guard {
      canActivate(ctx: ExecutionContext) {
        order.push(`guard:${isCommandContext(ctx) ? ctx.path : '?'}`)
        return AttributeFactory.get(Role, ctx.handler) !== 'admin'
      }
    }
    @Injectable()
    class Timing implements Interceptor {
      async intercept(_ctx: ExecutionContext, next: () => Promise<unknown>) {
        order.push('before')
        try {
          return await next()
        } finally {
          order.push('after')
        }
      }
    }

    @Command({ path: 'open', interceptors: [Timing] })
    class OpenCommand implements CommandHandler {
      execute() {
        order.push('open')
      }
    }
    @Command({ path: 'secret', attributes: [Role('admin')] })
    class SecretCommand implements CommandHandler {
      execute() {
        order.push('secret')
      }
    }
    @Module({ commands: [OpenCommand, SecretCommand], guards: [RoleGuard] })
    class GuardedModule {}

    await using cli = await createTestCli(GuardedModule)
    expect((await cli.run('open')).exitCode).toBe(0)
    expect(order).toEqual(['guard:open', 'before', 'open', 'after'])
    expect(await cli.run('secret')).toEqual({
      exitCode: 1,
      stdout: '',
      stderr: 'cli: secret: not allowed by RoleGuard',
    })
    expect(order).not.toContain('secret')
  })

  it('accepts @UseGuards above @Command', async () => {
    @Injectable()
    class Deny implements Guard {
      canActivate() {
        return false
      }
    }
    @UseGuards(Deny)
    @Command({ path: 'never' })
    class NeverCommand implements CommandHandler {
      execute() {}
    }
    @Module({ commands: [NeverCommand] })
    class NeverModule {}
    await using cli = await createTestCli(NeverModule)
    expect((await cli.run('never')).stderr).toBe('cli: never: not allowed by Deny')
  })

  it('builds a request-scoped command for every run and a singleton once', async () => {
    let scoped = 0
    let single = 0
    @Command({ path: 'scoped', scope: InjectableScope.Request })
    class ScopedCommand implements CommandHandler {
      constructor() {
        scoped++
      }
      execute() {}
    }
    @Command({ path: 'single' })
    class SingleCommand implements CommandHandler {
      constructor() {
        single++
      }
      execute() {}
    }
    @Module({ commands: [ScopedCommand, SingleCommand] })
    class ScopeModule {}
    await using cli = await createTestCli(ScopeModule, { requestScopedServices: 'allow' })
    expect(single).toBe(0) // nothing is built before it is needed
    await cli.run('scoped')
    await cli.run('scoped')
    await cli.run('single')
    await cli.run('single')
    expect([scoped, single]).toEqual([2, 1])
  })

  it('runs onFinish callbacks after the command', async () => {
    const order: string[] = []
    @Command({ path: 'work' })
    class WorkCommand implements CommandHandler {
      execute(_options: unknown, ctx: CommandContext) {
        ctx.onFinish(() => void order.push('finished'))
        order.push('executed')
      }
    }
    @Module({ commands: [WorkCommand] })
    class WorkModule {}
    await using cli = await createTestCli(WorkModule)
    await cli.run('work')
    expect(order).toEqual(['executed', 'finished'])
  })
})

describe('registration', () => {
  it('refuses two commands with one path and a class that is no command', async () => {
    @Command({ path: 'same' })
    class One implements CommandHandler {
      execute() {}
    }
    @Command({ path: 'other', aliases: ['same'] })
    class Two implements CommandHandler {
      execute() {}
    }
    @Module({ commands: [One, Two] })
    class ClashModule {}
    await expect(createTestCli(ClashModule)).rejects.toThrow(
      'Two commands answer to "same": One and Two.',
    )

    class Plain {}
    @Module({ commands: [Plain] })
    class PlainModule {}
    await expect(createTestCli(PlainModule)).rejects.toThrow(
      'Module PlainModule lists Plain in commands, but it is not decorated with @Command.',
    )
  })

  it('imports a lazy command only when it is used', async () => {
    @Command({
      path: 'heavy <file>',
      options: z.object({ file: z.string(), fast: z.boolean().default(false) }),
    })
    class HeavyCommand implements CommandHandler<{ file: string; fast: boolean }> {
      execute(options: { file: string; fast: boolean }, ctx: CommandContext) {
        ctx.output.write(`${options.file}:${options.fast}`)
      }
    }
    const load = vi.fn(async () => ({ default: HeavyCommand }))
    @Module({})
    class LazyModule {}
    await using cli = await createTestCli(LazyModule, {
      lazy: [lazyCommand({ path: 'heavy <file>', description: 'Heavy work', load })],
    })
    expect((await cli.run('')).stdout).toContain('heavy <file>')
    expect(load).not.toHaveBeenCalled()
    expect((await cli.run('heavy a.txt --fast')).stdout).toBe('a.txt:true')
    await cli.run('heavy b.txt')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('runs the default command when no arguments are given', async () => {
    await using cli = await createTestCli(AppModule, { defaultCommand: 'greet World' })
    expect((await cli.run('')).stdout).toBe('Hello, World!')
  })

  it('takes commands from the options of the transport', async () => {
    @Module({})
    class Empty {}
    await using cli = await createTestCli(Empty, { commands: [GreetCommand] })
    expect((await cli.run('greet you')).stdout).toBe('Hello, you!')
  })
})

describe('the transport in an application', () => {
  it('prints through CliOutput and aborts the signal of a running command on close', async () => {
    const lines: string[] = []
    let aborted = false
    @Command({ path: 'wait' })
    class WaitCommand implements CommandHandler {
      execute(_options: unknown, ctx: CommandContext) {
        ctx.output.write('waiting')
        return new Promise<void>((resolve) => {
          ctx.signal.addEventListener('abort', () => {
            aborted = true
            resolve()
          })
        })
      }
    }
    @Module({ commands: [WaitCommand] })
    class WaitModule {}
    const app = createApplication(WaitModule, {
      logger: false,
      transports: [cliTransport({ name: 'w' })],
      providers: [provide(CliOutput, { value: { write: (t) => void lines.push(t), error() {} } })],
    })
    await app.start()
    const running = app.transport(cliTransport).run(['wait'])
    await vi.waitFor(() => expect(lines).toEqual(['waiting']))
    await app.close()
    expect(aborted).toBe(true)
    expect(await running).toBe(0)
    expect(
      await app
        .transport(cliTransport)
        .run(['wait'])
        .catch(() => 'closed'),
    ).not.toBe(0)
  })
})
