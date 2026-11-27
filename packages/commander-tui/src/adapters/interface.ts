import type { ScreenManagerInstance } from '../services/screen_manager.ts'
import type { BindOptions, Theme } from '../types/index.ts'

/** What an adapter is given to draw. */
export interface TuiMountProps {
  /** The screens, their messages and prompts, and the events that say they changed. */
  manager: ScreenManagerInstance
  theme?: Theme
  /** The options the interface was bound with: sidebar, mouse, Ctrl+C. */
  options: BindOptions
}

/** A mounted interface. */
export interface TuiMount {
  /**
   * Removes the interface and gives the terminal back as it was: main
   * screen, cursor shown, mouse reporting off. Resolves when that is done,
   * so that what is printed next is not lost.
   */
  unmount(): void | Promise<void>
}

/**
 * Draws the screens in the terminal. `@navios/tui-adapter-ink` and
 * `@navios/tui-adapter-react` are adapters; pass one to `tui()`:
 *
 * ```ts
 * import { tui } from '@navios/commander-tui'
 * import { inkAdapter } from '@navios/tui-adapter-ink'
 *
 * createApplication(AppModule, { plugins: [tui({ adapter: inkAdapter() })] })
 * ```
 */
export interface TuiAdapter {
  /** For messages: `'ink'`. */
  readonly name: string
  /**
   * Whether the adapter can run in this process. `false`, or a string that
   * says why not, makes the screens print to standard output instead.
   */
  isSupported?(): boolean | string | Promise<boolean | string>
  /** Takes over the terminal and draws the screens until it is unmounted. */
  mount(props: TuiMountProps): TuiMount | Promise<TuiMount>
}
