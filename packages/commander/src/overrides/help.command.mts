import { ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'
import { z } from 'zod/v4'

import { Command } from '../decorators/command.decorator.mjs'
import { CommandRegistryService } from '../services/command-registry.service.mjs'
import { HelpCommandToken } from '../tokens/help-command.token.mjs'

import type { CommandHandler } from '../interfaces/command-handler.interface.mjs'

const helpOptionsSchema = z.object({
  command: z.string().optional(),
})

type HelpOptions = z.infer<typeof helpOptionsSchema>

/**
 * Built-in help command that lists all available commands or shows help for a specific command.
 *
 * @public
 */
@Command({
  token: HelpCommandToken,
  path: 'help',
  description: 'Show available commands or help for a specific command',
  optionsSchema: helpOptionsSchema,
  priority: 1000,
})
export class HelpCommand implements CommandHandler<HelpOptions> {
  private logger = inject(ScreenLogger, { screen: 'Help', context: 'Help' })
  private commandRegistry = inject(CommandRegistryService)

  async execute(options: HelpOptions): Promise<void> {
    if (options.command) {
      this.logger.log(this.commandRegistry.formatCommandHelp(options.command))
    } else {
      this.logger.log(this.commandRegistry.formatCommandList())
    }
  }
}
