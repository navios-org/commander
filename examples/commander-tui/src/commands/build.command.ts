import { Command } from '@navios/commander'
import { ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'
import { z } from 'zod/v4'

import type { CommandHandler, CommandOptions } from '@navios/commander'

import { delay } from '../utils/index.js'

const options = z.object({
  target: z
    .enum(['development', 'production'])
    .default('development')
    .meta({ alias: 't', description: 'What to build for' }),
  minify: z.boolean().default(false).meta({ description: 'Minify the output' }),
})

@Command({
  path: 'build',
  description: 'Build the project with progress tracking',
  options,
  examples: ['build --target production --minify'],
})
export class BuildCommand implements CommandHandler<typeof options> {
  private readonly logger = inject(ScreenLogger, { screen: 'Build', context: 'Build' })

  async execute({ target, minify }: CommandOptions<typeof options>): Promise<void> {
    this.logger.log(`Starting ${target} build...`)
    this.logger.debug(`Minify: ${minify}`)

    const steps = [
      'Resolving dependencies',
      'Compiling TypeScript',
      'Bundling modules',
      'Generating assets',
    ]
    if (minify) {
      steps.push('Minifying output')
    }

    const progress = this.logger.progress('Building', { total: steps.length })
    for (let i = 0; i < steps.length; i++) {
      progress.update(i, steps[i])
      await delay(800)
    }
    progress.complete('Build finished successfully!')

    this.logger.success(`${target} build finished successfully!`)
  }
}
