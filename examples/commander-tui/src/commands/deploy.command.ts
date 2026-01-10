import { Command, type CommandHandler } from '@navios/commander'
import { ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'
import { z } from 'zod'

import { delay } from '../utils/index.js'

const deployOptionsSchema = z.object({
  environment: z.enum(['staging', 'production']).default('staging'),
  dryRun: z.boolean().default(false),
})

type DeployOptions = z.infer<typeof deployOptionsSchema>

@Command({
  path: 'deploy',
  description: 'Deploy the application to the specified environment',
  optionsSchema: deployOptionsSchema,
})
export class DeployCommand implements CommandHandler<DeployOptions> {
  private readonly logger = inject(ScreenLogger, {
    screen: { name: 'Deploy', static: true },
    context: 'Deploy',
  })

  async execute(options: DeployOptions): Promise<void> {
    this.logger.log(`Deploying to ${options.environment}...`)

    if (options.dryRun) {
      this.logger.warn('Dry run mode - no actual changes will be made')
    }

    // Simulate deployment steps
    this.logger.log('Uploading artifacts...')
    await delay(1500)

    this.logger.log('Updating configuration...')
    await delay(1000)

    this.logger.log('Running health checks...')
    await delay(1200)

    this.logger.log(`Successfully deployed to ${options.environment}!`)
  }
}
