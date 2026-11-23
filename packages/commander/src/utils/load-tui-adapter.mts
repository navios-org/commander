import type { CommanderTuiOptions } from '../commander.factory.mjs'

import { dynamicImport } from './runtime.mjs'

/** The parts of `@navios/commander-tui` used to decide which adapter can run. */
export interface TuiRuntimeProbe {
  isBunRuntime(): boolean
  /**
   * Whether the OpenTUI renderer can run (Bun, or Node.js 26.4+ with
   * `--experimental-ffi`). Added in `@navios/commander-tui` 1.7.0.
   */
  isOpenTUISupported?: () => Promise<boolean>
}

/**
 * Import the TUI adapter package selected in `tuiOptions.adapter`.
 * Adapters register themselves with the DI container when imported.
 * The OpenTUI-based adapters (react, solid) are only loaded where OpenTUI can run.
 */
export async function loadTuiAdapter(
  tui: TuiRuntimeProbe,
  adapter: CommanderTuiOptions['adapter'],
): Promise<void> {
  if (adapter === 'ink') {
    await dynamicImport('@navios/tui-adapter-ink')
    return
  }
  if (adapter !== 'react' && adapter !== 'solid') return

  // Older commander-tui versions have no capability check: keep their Bun-only rule
  const canRunOpenTUI = tui.isOpenTUISupported ? await tui.isOpenTUISupported() : tui.isBunRuntime()
  if (canRunOpenTUI) {
    await dynamicImport(`@navios/tui-adapter-${adapter}`)
  }
}
