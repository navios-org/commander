import { Command, type CommandHandler } from '@navios/commander'
import { ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'
import { z } from 'zod'

import { delay } from '../utils/index.js'

const buildOptionsSchema = z.object({
  target: z.enum(['development', 'production']).default('development'),
  minify: z.boolean().default(false),
})

type BuildOptions = z.infer<typeof buildOptionsSchema>

@Command({
  path: 'build',
  description: 'Build the project with progress tracking',
  optionsSchema: buildOptionsSchema,
})
export class BuildCommand implements CommandHandler<BuildOptions> {
  // When TUI is enabled, this Logger is automatically the TUI's ScreenLogger
  private readonly logger = inject(ScreenLogger, {
    screen: { name: 'Build', static: true },
    context: 'Build',
  })

  async execute(options: BuildOptions): Promise<void> {
    this.logger.log(`Starting ${options.target} build...`)
    this.logger.debug(`Minify: ${options.minify}`)

    // Simulate build steps
    const steps = [
      'Resolving dependencies',
      'Compiling TypeScript',
      'Bundling modules',
      'Generating assets',
    ]

    if (options.minify) {
      steps.push('Minifying output')
    }
    const progress = this.logger.progress('Building', { total: steps.length })

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      progress.update(i, step)
      await delay(800)
    }
    progress.complete('Build finished successfully!')

    this.logger.log(`${options.target} build finished successfully!`)
  }
}
