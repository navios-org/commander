import { Command, type CommandHandler } from '@navios/commander'
import { ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'

import { delay } from '../utils/index.js'

@Command({
  path: 'status',
  description: 'Show system status',
})
export class StatusCommand implements CommandHandler {
  private readonly logger = inject(ScreenLogger, { screen: { name: 'Status' }, context: 'Status' })

  async execute(): Promise<void> {
    this.logger.log('Fetching system status...')

    this.logger.log('Checking database connection...')
    await delay(800)
    this.logger.debug('Host: localhost:5432')
    this.logger.debug('Database: myapp')

    this.logger.log('Checking cache status...')
    await delay(600)
    this.logger.debug('Type: Redis')
    this.logger.debug('Hit rate: 94.5%')

    this.logger.log('All systems operational!')
  }
}
