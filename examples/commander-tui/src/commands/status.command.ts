import { Command } from '@navios/commander'
import { ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'

import type { CommandHandler } from '@navios/commander'

import { delay } from '../utils/index.js'

@Command({ path: 'status', description: 'Show system status' })
export class StatusCommand implements CommandHandler {
  private readonly logger = inject(ScreenLogger, { screen: 'Status', context: 'Status' })

  async execute(): Promise<void> {
    this.logger.log('Checking database connection...')
    await delay(800)
    this.logger.log('Checking cache status...')
    await delay(600)

    this.logger.table(
      [
        { service: 'Database', status: 'up', detail: 'localhost:5432' },
        { service: 'Cache', status: 'up', detail: 'hit rate 94.5%' },
      ],
      { title: 'Services' },
    )
    this.logger.success('All systems operational!')
  }
}
