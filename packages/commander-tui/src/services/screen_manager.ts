import { EventEmitter } from 'node:events'

import { Injectable, optional, type OnServiceDestroy } from '@navios/core'

import type { LogLevel } from '@navios/core'

import { getThemePreset } from '../themes/index.ts'
import { Adapter } from '../tokens/adapter.ts'
import { ScreenManager } from '../tokens/screen-manager.ts'
import { RenderMode } from '../types/index.ts'
import { getPromptDefaultValue, printMessagesToStdout } from '../utils/index.ts'

import type { TuiAdapter, TuiMount } from '../adapters/interface.ts'
import type { ScreenOptionsInput } from '../schemas/index.ts'
import type {
  BindOptions,
  FocusArea,
  PromptData,
  ScreenManagerEventMap,
  SetupOptions,
  Theme,
} from '../types/index.ts'

import { ReadlinePromptService } from './readline_prompt.ts'
import { ScreenInstance } from './screen.ts'

export interface ManagerBindOptions extends BindOptions {
  /** The adapter to draw with, instead of the one that is provided for `Adapter`. */
  adapter?: TuiAdapter | null
}

@Injectable({ token: ScreenManager })
export class ScreenManagerInstance
  extends EventEmitter<ScreenManagerEventMap>
  implements OnServiceDestroy
{
  private screens: Map<string, ScreenInstance> = new Map()
  private screensByName: Map<string, ScreenInstance> = new Map()
  private screenOrder: string[] = []
  private screenCount = 0
  private activeScreenId: string | null = null
  private mount: TuiMount | null = null
  private providedAdapter = optional(Adapter)
  private mode: RenderMode = RenderMode.UNBOUND
  private binding: Promise<void> | null = null
  private unbinding: Promise<void> | null = null
  private readlinePromptService: ReadlinePromptService | null = null
  private bindOptions: BindOptions = {}
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null
  private theme: Theme | undefined
  private globalLogLevels: Set<LogLevel> | null = null

  // Keyboard navigation state (exposed for bridge component)
  public focusArea: FocusArea = 'content'
  public selectedIndex: number = 0

  constructor() {
    super()
    // Every part of an interface listens; the default limit of ten is a false alarm here.
    this.setMaxListeners(0)
  }

  /**
   * Create a new screen and return it
   */
  createScreen(options: ScreenOptionsInput): ScreenInstance {
    const id = `screen-${++this.screenCount}`
    const screen = new ScreenInstance(id, options)

    // Set up the screen with manager reference and print function
    screen._setManager(this)
    screen._setPrintFn(printMessagesToStdout)

    this.screens.set(id, screen)
    // The first screen of a name is the one the name finds.
    if (!this.screensByName.has(screen.getName())) {
      this.screensByName.set(screen.getName(), screen)
    }
    this.screenOrder.push(id)

    // Set first visible screen as active by default
    if (!this.activeScreenId && !screen.isHidden()) {
      this.activeScreenId = id
      // Emit activeScreen:changed so subscribers know about the new active screen
      this.emit('activeScreen:changed', id)
    }

    this.checkAutoClose()
    this.emit('screen:added', id)
    return screen
  }

  getScreenByName(name: string): ScreenInstance | undefined {
    return this.screensByName.get(name)
  }

  /**
   * Remove a screen dynamically
   */
  removeScreen(screen: ScreenInstance): void {
    const id = screen.getId()
    if (!this.screens.has(id)) return

    this.screens.delete(id)
    if (this.screensByName.get(screen.getName()) === screen) {
      this.screensByName.delete(screen.getName())
    }
    // Nobody will answer what it still asks.
    screen._cancelPrompts()
    this.screenOrder = this.screenOrder.filter((sid) => sid !== id)

    // If removed screen was active, switch to first visible screen
    if (this.activeScreenId === id) {
      const visibleScreens = this.getScreens()
      this.activeScreenId = visibleScreens[0]?.getId() ?? null
      this.emit('activeScreen:changed', this.activeScreenId)
    }

    // Update selected index if out of bounds
    const visibleScreens = this.getScreens()
    if (this.selectedIndex >= visibleScreens.length) {
      const newIndex = Math.max(0, visibleScreens.length - 1)
      if (newIndex !== this.selectedIndex) {
        this.selectedIndex = newIndex
        this.emit('sidebar:indexChanged', this.selectedIndex)
      }
    }

    this.checkAutoClose()
    this.emit('screen:removed', id)
  }

  /**
   * Starts showing the screens: with the adapter when there is one and it can
   * run here, otherwise on standard output. Without a terminal on both ends
   * (a pipe, CI) nothing changes: messages keep being printed as they come and
   * prompts answer with their defaults.
   *
   * Calling it again while it is bound, or being bound, changes nothing.
   */
  bind(options: ManagerBindOptions = {}): Promise<void> {
    if (this.mode !== RenderMode.UNBOUND) {
      return Promise.resolve()
    }
    this.binding ??= this.bindOnce(options).finally(() => {
      this.binding = null
    })
    return this.binding
  }

  private async bindOnce(options: ManagerBindOptions): Promise<void> {
    // An unbind that is under way still owns the terminal.
    await this.unbinding

    if (!process.stdout.isTTY || !process.stdin.isTTY) {
      return
    }

    const { adapter: givenAdapter, ...bindOptions } = options
    this.bindOptions = bindOptions
    if (options.theme) {
      this.theme = typeof options.theme === 'string' ? getThemePreset(options.theme) : options.theme
    }

    const adapter = givenAdapter === undefined ? this.providedAdapter : givenAdapter
    if (!adapter) {
      this.useStdout(RenderMode.STDOUT_INTERACTIVE)
      return
    }

    try {
      const supported = (await adapter.isSupported?.()) ?? true
      if (supported !== true) {
        throw new Error(typeof supported === 'string' ? supported : 'it cannot run in this process')
      }
      this.mount = await adapter.mount({ manager: this, theme: this.theme, options: bindOptions })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.warn(
        `[commander-tui] The ${adapter.name} adapter could not start: ${reason}. ` +
          'Printing to standard output instead.',
      )
      this.useStdout(RenderMode.STDOUT_FALLBACK)
      return
    }

    this.mode = RenderMode.TUI_ACTIVE
    this.emit('mode:changed', this.mode)
    // Screens that were created before may already be done.
    this.checkAutoClose()
  }

  private useStdout(mode: RenderMode): void {
    this.mode = mode
    this.readlinePromptService = new ReadlinePromptService()
    this.emit('mode:changed', this.mode)
  }

  /**
   * Get the current render mode
   */
  getRenderMode(): RenderMode {
    return this.mode
  }

  /**
   * Check if TUI is interactive (any mode except UNBOUND).
   * In interactive modes, prompts can be handled via readline or TUI.
   */
  isInteractive(): boolean {
    return this.mode !== RenderMode.UNBOUND
  }

  /**
   * Check if TUI rendering is active (TUI_ACTIVE mode).
   * When true, screens are rendered in the TUI and not printed to stdout.
   */
  hasTuiRenderer(): boolean {
    return this.mode === RenderMode.TUI_ACTIVE
  }

  /**
   * Handle a prompt via readline (for stdout modes)
   */
  handleReadlinePrompt(prompt: PromptData): Promise<string | boolean | string[]> {
    if (!this.readlinePromptService) {
      // This shouldn't happen, but return defaults as fallback
      return Promise.resolve(getPromptDefaultValue(prompt))
    }
    return this.readlinePromptService.handlePrompt(prompt)
  }

  /**
   * Get the configured theme
   */
  getTheme(): Theme | undefined {
    return this.theme
  }

  /**
   * Setup global configuration for the screen manager.
   * Can be called before or after bind() to configure theme and log levels.
   */
  setup(options: SetupOptions): void {
    if (options.theme) {
      this.theme = typeof options.theme === 'string' ? getThemePreset(options.theme) : options.theme
    }

    if (options.logLevels) {
      this.globalLogLevels = new Set(options.logLevels)
    }
  }

  /**
   * Check if a log level is enabled globally.
   * Returns true if no global filter is set, or if the level is in the allowed set.
   */
  isLogLevelEnabled(level: LogLevel): boolean {
    if (this.globalLogLevels === null) {
      return true
    }
    return this.globalLogLevels.has(level)
  }

  /**
   * Get the current global log levels filter.
   * Returns null if no filter is set (all levels allowed).
   */
  getGlobalLogLevels(): LogLevel[] | null {
    return this.globalLogLevels ? Array.from(this.globalLogLevels) : null
  }

  async onServiceDestroy(): Promise<void> {
    await this.unbind()
  }

  /**
   * Stops showing the screens, gives the terminal back and prints what the
   * interface held: in the terminal a screen is only ever drawn, so its
   * messages reach standard output here. Prompts that nobody answered resolve
   * with their defaults.
   */
  unbind(): Promise<void> {
    this.unbinding ??= this.unbindOnce().finally(() => {
      this.unbinding = null
    })
    return this.unbinding
  }

  private async unbindOnce(): Promise<void> {
    // A bind that is under way has to finish first, or it would bind after this.
    await this.binding?.catch(() => {})

    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }

    if (this.mode === RenderMode.UNBOUND) {
      // Even in unbound mode, flush any remaining screens on destroy
      this.flushRemainingScreens()
      return
    }

    const previousMode = this.mode
    const mount = this.mount
    this.mount = null
    // From here on messages are printed again instead of drawn.
    this.mode = RenderMode.UNBOUND

    for (const screen of this.screens.values()) {
      screen._cancelPrompts()
    }

    try {
      await mount?.unmount()
    } catch (error) {
      console.error('[commander-tui] Error while closing the interface:', error)
    }

    if (this.readlinePromptService) {
      this.readlinePromptService.destroy()
      this.readlinePromptService = null
    }

    this.flushScreensOnExit(previousMode)
    this.emit('mode:changed', this.mode)
  }

  /**
   * Flush screens on exit based on the mode we're exiting from
   */
  private flushScreensOnExit(previousMode: RenderMode): void {
    for (const id of this.screenOrder) {
      const screen = this.screens.get(id)
      if (!screen || screen.isHidden()) continue

      if (previousMode === RenderMode.TUI_ACTIVE) {
        // TUI mode: print EVERYTHING on exit (nothing printed during operation)
        screen._flushToConsole(true)
      } else {
        // Stdout modes (stdout, fallback): print only what hasn't been printed yet
        // Static screens already printed incrementally
        if (!screen.hasPrintedToConsole()) {
          screen._flushToConsole(true)
        }
      }
    }
  }

  /**
   * Flush any remaining non-hidden screens that haven't been printed.
   * Called on destroy even in UNBOUND mode to handle forgotten completions.
   */
  private flushRemainingScreens(): void {
    for (const id of this.screenOrder) {
      const screen = this.screens.get(id)
      if (!screen || screen.isHidden()) continue

      if (!screen.hasPrintedToConsole()) {
        screen._flushToConsole(true)
      }
    }
  }

  /**
   * Called by Screen when a prompt becomes active
   * Focuses the screen and switches to content area
   */
  onScreenPromptActivated(screen: ScreenInstance): void {
    if (screen.isHidden()) {
      // A question nobody can see would never be answered.
      screen.show()
    }
    const prevActiveId = this.activeScreenId
    this.activeScreenId = screen.getId()
    if (prevActiveId !== this.activeScreenId) {
      this.emit('activeScreen:changed', this.activeScreenId)
    }
    if (this.focusArea !== 'content') {
      this.focusArea = 'content'
      this.emit('focus:changed', this.focusArea)
    }
  }

  /**
   * Check if any screen has an active prompt
   */
  hasActivePrompt(): boolean {
    for (const screen of this.screens.values()) {
      if (screen.hasActivePrompt()) {
        return true
      }
    }
    return false
  }

  /**
   * Get the screen with an active prompt (if any)
   */
  getScreenWithActivePrompt(): ScreenInstance | null {
    for (const screen of this.screens.values()) {
      if (screen.hasActivePrompt()) {
        return screen
      }
    }
    return null
  }

  /**
   * Called by Screen when visibility changes
   * Handles switching active screen if needed
   */
  onScreenVisibilityChanged(screen: ScreenInstance): void {
    // If the hidden screen was active, switch to first visible screen
    if (screen.isHidden() && this.activeScreenId === screen.getId()) {
      const visibleScreens = this.getScreens()
      this.activeScreenId = visibleScreens[0]?.getId() ?? null
      this.selectedIndex = 0
      this.emit('activeScreen:changed', this.activeScreenId)
      this.emit('sidebar:indexChanged', this.selectedIndex)
    }

    // Update selected index if it's now out of bounds
    const visibleScreens = this.getScreens()
    if (this.selectedIndex >= visibleScreens.length) {
      const newIndex = Math.max(0, visibleScreens.length - 1)
      if (newIndex !== this.selectedIndex) {
        this.selectedIndex = newIndex
        this.emit('sidebar:indexChanged', this.selectedIndex)
      }
    }

    this.checkAutoClose()
  }

  /**
   * Called by Screen when status becomes success/fail
   * Moves completed screens to end of sidebar list
   */
  onScreenCompleted(screen: ScreenInstance): void {
    const id = screen.getId()
    const index = this.screenOrder.indexOf(id)

    if (index !== -1) {
      // Remove from current position
      this.screenOrder.splice(index, 1)
      // Add to end
      this.screenOrder.push(id)

      // Update selected index if needed (based on visible screens)
      const visibleScreens = this.getScreens()
      if (this.selectedIndex >= visibleScreens.length) {
        const newIndex = Math.max(0, visibleScreens.length - 1)
        if (newIndex !== this.selectedIndex) {
          this.selectedIndex = newIndex
          this.emit('sidebar:indexChanged', this.selectedIndex)
        }
      }

      this.checkAutoClose()
      this.emit('screen:reordered')
    }
  }

  /**
   * Check if all screens are successful (or only static) and start auto-close timer if enabled.
   * Static screens are ignored in this calculation.
   * If there are only static screens, the timer will trigger after the delay with no new activity.
   */
  private checkAutoClose(): void {
    const autoClose = this.bindOptions.autoClose
    if (!autoClose || this.mode === RenderMode.UNBOUND) return

    // Clear any existing timer (will be restarted if conditions are met)
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }

    // Get non-static screens
    const nonStaticScreens = this.getScreens().filter((s) => s.getStatus() !== 'static')

    // If there are non-static screens, check if all are successful
    if (nonStaticScreens.length > 0) {
      const allSuccessful = nonStaticScreens.every((s) => s.getStatus() === 'success')
      if (!allSuccessful) return
    }

    // Start auto-close timer (either all non-static screens succeeded, or only static screens exist)
    const delay = typeof autoClose === 'number' ? autoClose : 5000
    this.autoCloseTimer = setTimeout(() => {
      this.unbind().catch((error: unknown) => {
        console.error('[commander-tui] Error while closing the interface:', error)
      })
    }, delay)
    // The timer alone must not keep the process alive.
    this.autoCloseTimer.unref?.()
  }

  /**
   * Get visible screens in display order (excludes hidden screens)
   */
  getScreens(): ScreenInstance[] {
    return this.screenOrder
      .map((id) => this.screens.get(id))
      .filter((s): s is ScreenInstance => s !== undefined && !s.isHidden())
  }

  /**
   * Get all screens in display order (includes hidden screens)
   */
  getAllScreens(): ScreenInstance[] {
    return this.screenOrder
      .map((id) => this.screens.get(id))
      .filter((s): s is ScreenInstance => s !== undefined)
  }

  /**
   * Get the active screen
   */
  getActiveScreen(): ScreenInstance | null {
    return this.activeScreenId ? (this.screens.get(this.activeScreenId) ?? null) : null
  }

  /**
   * Set the active screen
   */
  setActiveScreen(screen: ScreenInstance): void {
    const prevActiveId = this.activeScreenId
    this.activeScreenId = screen.getId()
    if (prevActiveId !== this.activeScreenId) {
      this.emit('activeScreen:changed', this.activeScreenId)
    }
  }

  /**
   * Get bind options
   */
  getBindOptions(): BindOptions {
    return this.bindOptions
  }

  /**
   * Set focus area (sidebar or content)
   */
  setFocusArea(area: FocusArea): void {
    if (this.focusArea !== area) {
      this.focusArea = area
      this.emit('focus:changed', area)
    }
  }

  /**
   * Set selected index in sidebar
   */
  setSelectedIndex(index: number): void {
    const visibleScreens = this.getScreens()
    const newIndex = Math.max(0, Math.min(index, visibleScreens.length - 1))
    if (this.selectedIndex !== newIndex) {
      this.selectedIndex = newIndex
      this.emit('sidebar:indexChanged', newIndex)
    }
  }

  /**
   * Navigate sidebar up
   */
  navigateUp(): void {
    this.setSelectedIndex(this.selectedIndex - 1)
  }

  /**
   * Navigate sidebar down
   */
  navigateDown(): void {
    this.setSelectedIndex(this.selectedIndex + 1)
  }

  /**
   * Select the currently highlighted screen
   */
  selectCurrent(): void {
    const screens = this.getScreens()
    const screen = screens[this.selectedIndex]
    if (screen) {
      this.setActiveScreen(screen)
    }
  }

  /**
   * Toggle focus between sidebar and content
   */
  toggleFocus(): void {
    this.focusArea = this.focusArea === 'sidebar' ? 'content' : 'sidebar'
    this.emit('focus:changed', this.focusArea)
  }
}
