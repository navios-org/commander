/**
 * The program of the documentation's quick start and home page. What the
 * docs show as its output is asserted here, so the two cannot drift apart.
 */
import { inject, Injectable, Module, provide } from '@navios/core'
import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'

import { Command } from '../index.mjs'
import { createTestCli } from '../testing/index.mjs'

import type { CommandContext, CommandHandler, CommandOptions } from '../index.mjs'

@Injectable()
class Deployer {
  async deploy(env: string, tags: string[]): Promise<void> {
    void env
    void tags
  }
}

const options = z.object({
  env: z.enum(['staging', 'production']),
  dryRun: z.boolean().default(false).meta({ alias: 'n', description: 'Change nothing' }),
  tag: z.array(z.string()).default([]).meta({ description: 'Tags to deploy' }),
})

@Command({
  path: 'deploy <env>',
  description: 'Deploy the application',
  options,
  examples: ['deploy production --dry-run'],
})
class DeployCommand implements CommandHandler<typeof options> {
  private readonly deployer = inject(Deployer)

  async execute({ env, dryRun, tag }: CommandOptions<typeof options>, ctx: CommandContext) {
    const tags = tag.length > 0 ? ` (${tag.join(', ')})` : ''
    if (dryRun) {
      ctx.output.write(`Would deploy to ${env}${tags}`)
      return
    }
    await this.deployer.deploy(env, tag)
    ctx.output.write(`Deployed to ${env}${tags}`)
  }
}

@Module({ commands: [DeployCommand] })
class AppModule {}

describe('the program of the documentation', () => {
  it('runs', async () => {
    const deployed: string[] = []
    await using cli = await createTestCli(AppModule, {
      name: 'mycli',
      providers: [
        provide(Deployer, {
          value: { deploy: async (env: string) => void deployed.push(env) },
        }),
      ],
    })
    expect(await cli.run('deploy production --dry-run')).toEqual({
      exitCode: 0,
      stdout: 'Would deploy to production',
      stderr: '',
    })
    expect((await cli.run('deploy staging -n --tag v2 --tag canary')).stdout).toBe(
      'Would deploy to staging (v2, canary)',
    )
    expect((await cli.run('deploy staging')).stdout).toBe('Deployed to staging')
    expect(deployed).toEqual(['staging'])
  })

  it('prints the help the docs show', async () => {
    await using cli = await createTestCli(AppModule, { name: 'mycli', version: '1.0.0' })
    expect((await cli.run('deploy --help')).stdout).toMatchInlineSnapshot(`
      "Usage: mycli deploy <env> [options]

      Deploy the application

      Arguments:
        <env>  (staging | production)

      Options:
        -n, --dry-run          Change nothing
            --tag <string...>  Tags to deploy (repeatable)
        -h, --help             Show help

      Examples:
        mycli deploy production --dry-run"
    `)
    expect((await cli.run('--help')).stdout).toMatchInlineSnapshot(`
      "Usage: mycli <command> [options]

      Commands:
        deploy <env>       Deploy the application
        help [...command]  Show help for a command

      Options:
        -h, --help     Show help
        -V, --version  Show the version

      Run "mycli <command> --help" for the options of a command."
    `)
  })

  it('reports the mistakes the docs show', async () => {
    await using cli = await createTestCli(AppModule, { name: 'mycli' })
    expect(await cli.run('deploy production --dry-rnu')).toMatchInlineSnapshot(`
      {
        "exitCode": 2,
        "stderr": "mycli: Unknown option --dry-rnu. Did you mean --dry-run?
      Run "mycli deploy --help" for usage.",
        "stdout": "",
      }
    `)
    expect(await cli.run('deploy nowhere')).toMatchInlineSnapshot(`
      {
        "exitCode": 2,
        "stderr": "mycli: <env>: Invalid option: expected one of "staging"|"production"
      Run "mycli deploy --help" for usage.",
        "stdout": "",
      }
    `)
    expect(await cli.run('depoly')).toMatchInlineSnapshot(`
      {
        "exitCode": 2,
        "stderr": "mycli: Unknown command "depoly". Did you mean "deploy"?
      Run "mycli --help" for usage.",
        "stdout": "",
      }
    `)
    expect(await cli.run('deploy')).toMatchInlineSnapshot(`
      {
        "exitCode": 2,
        "stderr": "mycli: Missing argument <env>
      Run "mycli deploy --help" for usage.",
        "stdout": "",
      }
    `)
  })
})

describe('what the essentials pages say', () => {
  it('matches the longest path, and lists a group', async () => {
    @Command({ path: 'db [name]', options: z.object({ name: z.string().optional() }) })
    class DbCommand {
      execute({ name }: { name?: string }, ctx: CommandContext) {
        ctx.output.write(`db:${name ?? ''}`)
      }
    }
    @Command({ path: 'db migrate', description: 'Run pending migrations' })
    class MigrateCommand {
      execute(_options: unknown, ctx: CommandContext) {
        ctx.output.write('migrate')
      }
    }
    @Module({ commands: [DbCommand, MigrateCommand] })
    class Both {}
    await using cli = await createTestCli(Both)
    expect((await cli.run('db migrate')).stdout).toBe('migrate')
    expect((await cli.run('db other')).stdout).toBe('db:other')
  })

  it('reads descriptions, word aliases, hidden options and special values from the schema', async () => {
    const schema = z.object({
      target: z
        .enum(['development', 'production'])
        .default('development')
        .meta({ alias: ['t', 'env'] }),
      grep: z.string().optional().describe('Only lines that match'),
      secret: z.string().optional().meta({ hidden: true }),
      id: z.bigint().optional(),
      db: z
        .object({
          host: z.string(),
          port: z.number().default(5432),
          tls: z.boolean().default(false),
        })
        .optional(),
    })
    let seen: unknown
    @Command({ path: 'build', options: schema })
    class BuildCommand implements CommandHandler<typeof schema> {
      execute(options: CommandOptions<typeof schema>) {
        seen = options
      }
    }
    @Module({ commands: [BuildCommand] })
    class BuildModule {}
    await using cli = await createTestCli(BuildModule)

    const help = (await cli.run('build --help')).stdout
    expect(help).toContain('-t, --target, --env <development|production>')
    expect(help).toContain('Only lines that match')
    expect(help).not.toContain('--secret')
    expect(help).toContain('--db.host <string>')

    await cli.run([
      'build',
      '--env',
      'production',
      '--grep',
      '-foo',
      '--id',
      '9007199254740993',
      '--db',
      '{"host":"h"}',
    ])
    expect(seen).toEqual({
      target: 'production',
      grep: '-foo',
      id: 9007199254740993n,
      db: { host: 'h', port: 5432, tls: false },
    })
    await cli.run('build --db.host localhost --db.port 5433 --db.tls --secret s')
    expect(seen).toMatchObject({ db: { host: 'localhost', port: 5433, tls: true }, secret: 's' })
  })

  it('lets a guard refuse with a message of its own', async () => {
    const { CliError, CliUsageError } = await import('../index.mjs')
    const { Injectable } = await import('@navios/core')
    @Injectable()
    class RequireLogin {
      canActivate(): boolean {
        throw new CliError('You are not logged in. Run "mycli login" first.')
      }
    }
    @Command({ path: 'deploy', guards: [RequireLogin] })
    class GuardedCommand {
      execute() {}
    }
    @Command({ path: 'range' })
    class RangeCommand {
      execute(_options: unknown, ctx: CommandContext) {
        throw new CliUsageError('--since and --until cannot be combined', ctx.path)
      }
    }
    @Module({ commands: [GuardedCommand, RangeCommand] })
    class GuardModule {}
    await using cli = await createTestCli(GuardModule, { name: 'mycli' })
    expect(await cli.run('deploy')).toEqual({
      exitCode: 1,
      stdout: '',
      stderr: 'mycli: You are not logged in. Run "mycli login" first.',
    })
    expect(await cli.run('range')).toEqual({
      exitCode: 2,
      stdout: '',
      stderr: 'mycli: --since and --until cannot be combined\nRun "mycli range --help" for usage.',
    })
  })
})
