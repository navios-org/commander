import { CliError, Command } from '@navios/commander'
import { Prompt, ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'
import { z } from 'zod/v4'

import type { CommandContext, CommandHandler, CommandOptions } from '@navios/commander'

import { delay } from '../utils/index.js'

const options = z.object({
  environment: z.enum(['staging', 'production']).default('staging'),
  dryRun: z.boolean().default(false).meta({ alias: 'n', description: 'Change nothing' }),
})

@Command({
  path: 'deploy [environment]',
  description: 'Deploy the application to an environment',
  options,
  examples: ['deploy', 'deploy production --dry-run'],
})
export class DeployCommand implements CommandHandler<typeof options> {
  private readonly logger = inject(ScreenLogger, { screen: 'Deploy', context: 'Deploy' })
  private readonly prompt = inject(Prompt, { screen: 'Deploy' })

  async execute(
    { environment, dryRun }: CommandOptions<typeof options>,
    ctx: CommandContext,
  ): Promise<void> {
    if (environment === 'production' && !dryRun) {
      // Without a terminal nobody can answer, and the answer is the default: no.
      const sure = await this.prompt.confirm({ question: 'Deploy to production?' })
      if (!sure) {
        throw new CliError('Deployment cancelled', { exitCode: 1 })
      }
    }

    this.logger.log(`Deploying to ${environment}...`)
    if (dryRun) {
      this.logger.warn('Dry run: no changes will be made')
    }

    for (const [step, ms] of [
      ['Uploading artifacts', 1500],
      ['Updating configuration', 1000],
      ['Running health checks', 1200],
    ] as const) {
      if (ctx.signal.aborted) {
        // Ctrl+C
        throw new CliError('Deployment interrupted', { exitCode: 130 })
      }
      const loading = this.logger.loading(`${step}...`)
      await delay(ms)
      loading.success(step)
    }

    this.logger.success(`Deployed to ${environment}`)
  }
}
