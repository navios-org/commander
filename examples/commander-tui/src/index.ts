/**
 * A command line application with a terminal interface.
 *
 *   yarn start build --target production --minify
 *   yarn start deploy production --dry-run
 *   yarn start status
 *   yarn start --help
 *
 * In a terminal the commands draw their screens with Ink. Piped, or in CI,
 * the same commands print plain lines.
 */
import { runCli } from '@navios/commander'
import { tui } from '@navios/commander-tui'
import { inkAdapter } from '@navios/tui-adapter-ink'

import { AppModule } from './app.module.js'

await runCli(AppModule, {
  name: 'demo',
  description: 'Commander with a terminal interface',
  version: '1.0.0',
  plugins: [
    tui({
      adapter: inkAdapter(),
      sidebar: { title: 'Commander TUI Demo' },
      logScreen: { hidden: true },
    }),
  ],
})
