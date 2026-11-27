import { Module } from '@navios/core'

import { BuildCommand, DeployCommand, StatusCommand } from './commands/index.js'

@Module({
  commands: [BuildCommand, DeployCommand, StatusCommand],
})
export class AppModule {}
