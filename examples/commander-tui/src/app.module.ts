import { CliModule } from '@navios/commander'

import { BuildCommand, DeployCommand, StatusCommand } from './commands/index.js'

@CliModule({
  commands: [BuildCommand, DeployCommand, StatusCommand],
})
export class AppModule {}
