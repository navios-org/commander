import { EventEmitter } from 'node:events'

import { Container, Injectable, inject, type OnServiceDestroy } from '@navios/core'

import type { LogLevel } from '@navios/core'
import type { CliRenderer } from '@opentui/core'

import { getThemePreset } from '../themes/index.ts'
import { Adapter } from '../tokens/adapter.ts'
import { ScreenManager } from '../tokens/screen-manager.ts'
import { dynamicImport, getPromptDefaultValue, isBunRuntime, printMessagesToStdout } from '../utils/index.ts'

import type { AdapterInterface, AdapterRoot } from '../adapters/interface.ts'
import type { ScreenOptions } from '../schemas/index.ts'
import { RenderMode } from '../types/index.ts'
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

@Injectable({ token: ScreenManager })
export class ScreenManagerInstance
  extends EventEmitter<ScreenManagerEventMap>
  implements OnServiceDestroy
{
  private screens: Map<string, ScreenInstance> = new Map()
  private screenOrder: string[] = []
  private activeScreenId: string | null = null
  private renderer: CliRenderer | null = null
  private root: AdapterRoot | null = null
  private adapter: AdapterInterface | null = null
  private container = inject(Container)
  private mode: RenderMode = RenderMode.UNBOUND
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
  }

  /**
   * Create a new screen and return it
   */
  createScreen(options: ScreenOptions): ScreenInstance {
    const id = `screen-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const screen = new ScreenInstance(id, options)

    // Set up the screen with manager reference and print function
    screen._setManager(this)
    screen._setPrintFn(printMessagesToStdout)

    this.screens.set(id, screen)
    this.screenOrder.push(id)

    // Set first visible screen as active by default
    if (!this.activeScreenId && !screen.isHidden()) {
      this.activeScreenId = id
    }

    this.checkAutoClose()
    this.emit('screen:added', id)
    return screen
  }

  getScreenByName(name: string): ScreenInstance | undefined {
    const id = Array.from(this.screens.keys()).find(
      (id) => this.screens.get(id)?.getName() === name,
    )
    return id ? this.screens.get(id) : undefined
  }

  /**
   * Remove a screen dynamically
   */
  removeScreen(screen: ScreenInstance): void {
    const id = screen.getId()
    if (!this.screens.has(id)) return

    this.screens.delete(id)
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
   * Non-blocking bind - starts TUI rendering in background
   */
  async bind(options?: BindOptions): Promise<void> {
    if (this.mode !== RenderMode.UNBOUND) return

    this.bindOptions = options ?? {}

    // Resolve theme from options
    if (options?.theme) {
      this.theme = typeof options.theme === 'string' ? getThemePreset(options.theme) : options.theme
    }

    // Determine useOpenTUI default: false for Bun (not supported), true for Node.js
    const useOpenTUI = options?.useOpenTUI ?? !isBunRuntime()

    if (!useOpenTUI) {
      // Explicit stdout mode requested
      this.mode = RenderMode.STDOUT_INTERACTIVE
      this.readlinePromptService = new ReadlinePromptService()
      this.emit('mode:changed', this.mode)
      return
    }

    // Try to initialize TUI adapter
    try {
      this.adapter = await this.container.get(Adapter)

      // Check if adapter is the MissingAdapterOverride (has marker property)
      if ((this.adapter as { isMissingAdapter?: boolean }).isMissingAdapter) {
        throw new Error('No adapter registered')
      }

      // Check if adapter handles its own rendering (e.g., Ink adapter)
      if (this.adapter.handlesOwnRenderer) {
        // Adapter manages its own renderer - no OpenTUI needed
        this.root = await this.adapter.createRoot()
      } else {
        // Default path: use OpenTUI renderer
        // Dynamic import using Function constructor to bypass bundler static analysis
        const { createCliRenderer } =
          await dynamicImport<typeof import('@opentui/core')>('@opentui/core')

        this.renderer = await createCliRenderer({
          exitOnCtrlC: options?.exitOnCtrlC ?? true,
          useAlternateScreen: true,
          useMouse: options?.useMouse ?? true,
        })

        this.root = await this.adapter.createRoot(this.renderer!)
      }

      this.mode = RenderMode.TUI_ACTIVE
      this.emit('mode:changed', this.mode)

      // Initial render
      this.render()
    } catch {
      // Graceful fallback to stdout mode with warning
      console.warn(
        '[commander-tui] TUI adapter not available, falling back to stdout mode. ' +
          'To enable TUI, import a TUI adapter: @navios/tui-adapter-react, @navios/tui-adapter-ink, or @navios/tui-adapter-solid',
      )

      this.mode = RenderMode.STDOUT_FALLBACK
      this.readlinePromptService = new ReadlinePromptService()
      this.adapter = null
      this.renderer = null
      this.root = null
      this.emit('mode:changed', this.mode)
    }
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

  onServiceDestroy(): void {
    this.unbind()
  }

  /**
   * Stop TUI rendering and cleanup
   * Flushes screens to stdout/stderr based on mode
   */
  unbind(): void {
    if (this.mode === RenderMode.UNBOUND) {
      // Even in unbound mode, flush any remaining screens on destroy
      this.flushRemainingScreens()
      return
    }

    const previousMode = this.mode

    // Clear any pending auto-close timer
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }

    // Cleanup TUI if active
    if (previousMode === RenderMode.TUI_ACTIVE) {
      if (this.root) {
        this.root.unmount()
      }

      // Explicitly disable mouse tracking before destroy to prevent escape sequence leakage
      if (this.renderer) {
        if ('disableMouse' in this.renderer) {
          ;(this.renderer as unknown as { disableMouse: () => void }).disableMouse()
        }
        this.renderer.destroy()
      }
    }

    // Cleanup readline if used
    if (this.readlinePromptService) {
      this.readlinePromptService.destroy()
      this.readlinePromptService = null
    }

    // Flush screens based on previous mode
    this.flushScreensOnExit(previousMode)

    // Reset state
    this.mode = RenderMode.UNBOUND
    this.renderer = null
    this.root = null
    this.adapter = null
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
   * Check if TUI is currently bound
   * @deprecated Use isInteractive() instead
   */
  isTuiBound(): boolean {
    return this.isInteractive()
  }

  /**
   * Check if TUI rendering is active (has renderer or self-rendering adapter).
   * @deprecated Use hasTuiRenderer() instead
   */
  isTuiRendererActive(): boolean {
    return this.hasTuiRenderer()
  }

  /**
   * Check if OpenTUI rendering is active (has renderer).
   * @deprecated Use hasTuiRenderer() instead
   */
  isOpenTUIActive(): boolean {
    return this.hasTuiRenderer()
  }

  /**
   * Called by Screen when a prompt becomes active
   * Focuses the screen and switches to content area
   */
  onScreenPromptActivated(screen: ScreenInstance): void {
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
      this.unbind()
    }, delay)
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

  private render(): void {
    if (!this.root || !this.adapter) return

    // Adapter owns the bridge component - no React import here
    this.adapter.renderToRoot(this.root, {
      manager: this,
      theme: this.theme,
    })
  }
}
