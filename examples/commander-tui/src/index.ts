// @ts-expect-error - Symbol.metadata is not defined in the global scope
Symbol.metadata ??= Symbol('Symbol.metadata')

/**
 * Commander TUI Integration Example
 *
 * This example demonstrates using @navios/commander with TUI mode enabled.
 * When enableTUI is true, the standard Logger is automatically overridden
 * to use the TUI's ScreenLogger, providing rich terminal UI logging.
 *
 * Run with:
 *   yarn start build     - Run the build command
 *   yarn start deploy    - Run the deploy command
 *   yarn start status    - Run the status command
 */

import { CommanderFactory } from '@navios/commander'

import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await CommanderFactory.create(AppModule, {
    enableTUI: true,
    tuiOptions: {
      sidebarTitle: 'Commander TUI Demo',
      autoClose: 5000, // Auto close 5 seconds after all screens complete
      hideDefaultScreen: true,
      adapter: 'ink',
    },
  })

  await app.init()

  const adapter = app.getAdapter()
  await adapter.run(process.argv)
  await app.close()
  console.log('App closed')
}

bootstrap().catch(console.error)
