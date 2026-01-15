import { Container, Injectable, inject, type OnServiceDestroy } from '@navios/core'

import type { LogLevel } from '@navios/core'
import type { CliRenderer } from '@opentui/core'

import { getThemePreset } from '../themes/index.ts'
import { Adapter } from '../tokens/adapter.ts'
import { ScreenManager } from '../tokens/screen-manager.ts'
import { dynamicImport, isBunRuntime, printMessagesToStdout } from '../utils/index.ts'

import type { AdapterInterface, AdapterRoot } from '../adapters/interface.ts'
import type { ScreenOptions } from '../schemas/index.ts'
import type { BindOptions, FocusArea, SetupOptions, Theme } from '../types/index.ts'

import { ScreenInstance } from './screen.ts'

@Injectable({ token: ScreenManager })
export class ScreenManagerInstance implements OnServiceDestroy {
  private screens: Map<string, ScreenInstance> = new Map()
  private screenOrder: string[] = []
  private activeScreenId: string | null = null
  private renderer: CliRenderer | null = null
  private root: AdapterRoot | null = null
  private adapter: AdapterInterface | null = null
  private container = inject(Container)
  private isBound: boolean = false
  private changeListeners: Set<() => void> = new Set()
  private bindOptions: BindOptions = {}
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null
  private theme: Theme | undefined
  private globalLogLevels: Set<LogLevel> | null = null

  // Keyboard navigation state (exposed for bridge component)
  public focusArea: FocusArea = 'content'
  public selectedIndex: number = 0

  /**
   * Create a new screen and return it
   */
  createScreen(options: ScreenOptions): ScreenInstance {
    const id = `screen-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const screen = new ScreenInstance(id, options)

    // Set up the screen with manager reference and print function
    screen._setManager(this)
    screen._setPrintFn(printMessagesToStdout)

    // Subscribe to screen changes
    screen.onChange(() => this.notifyChange())

    this.screens.set(id, screen)
    this.screenOrder.push(id)

    // Set first visible screen as active by default
    if (!this.activeScreenId && !screen.isHidden()) {
      this.activeScreenId = id
    }

    this.notifyChange()
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
    }

    // Update selected index if out of bounds
    const visibleScreens = this.getScreens()
    if (this.selectedIndex >= visibleScreens.length) {
      this.selectedIndex = Math.max(0, visibleScreens.length - 1)
    }

    this.notifyChange()
  }

  /**
   * Non-blocking bind - starts TUI rendering in background
   */
  async bind(options?: BindOptions): Promise<void> {
    if (this.isBound) return

    this.bindOptions = options ?? {}

    // Resolve theme from options
    if (options?.theme) {
      this.theme = typeof options.theme === 'string' ? getThemePreset(options.theme) : options.theme
    }

    // Determine useOpenTUI default: false for Bun (not supported), true for Node.js
    const useOpenTUI = options?.useOpenTUI ?? isBunRuntime()

    if (useOpenTUI) {
      // Dynamic import of OpenTUI using Function constructor to bypass bundler static analysis
      const { createCliRenderer } =
        await dynamicImport<typeof import('@opentui/core')>('@opentui/core')

      this.renderer = await createCliRenderer({
        exitOnCtrlC: options?.exitOnCtrlC ?? true,
        useAlternateScreen: true,
        useMouse: options?.useMouse ?? true,
      })

      // Get adapter from container (React/Solid should already be registered)
      this.adapter = await this.container.get(Adapter)
      this.root = await this.adapter.createRoot(this.renderer!)

      // Initial render
      this.render()
    }
    // When useOpenTUI is false: no renderer, no root, no adapter
    // Static screens print immediately, others print on completion

    this.isBound = true
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
   * Flushes all completed screens to stdout/stderr
   */
  unbind(): void {
    if (!this.isBound) return

    // Clear any pending auto-close timer
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }

    // Only cleanup if OpenTUI was used
    if (this.root) {
      this.root.unmount()
    }

    // Explicitly disable mouse tracking before destroy to prevent escape sequence leakage
    // Using type assertion to access private method as a safety measure
    if (this.renderer) {
      if ('disableMouse' in this.renderer) {
        ;(this.renderer as unknown as { disableMouse: () => void }).disableMouse()
      }
      this.renderer.destroy()
    }

    // Flush all completed screens to console (in order)
    // Must happen before isBound = false so screens can check isTuiBound()
    this.flushCompletedScreens()

    this.isBound = false
    this.renderer = null
    this.root = null
    this.adapter = null
  }

  /**
   * Print all completed screens that haven't been printed yet
   */
  private flushCompletedScreens(): void {
    for (const id of this.screenOrder) {
      const screen = this.screens.get(id)
      if (screen && !screen.hasPrintedToConsole()) {
        screen._flushToConsole(true)
      }
    }
  }

  /**
   * Check if TUI is currently bound
   */
  isTuiBound(): boolean {
    return this.isBound
  }

  /**
   * Check if OpenTUI rendering is active (has renderer).
   * When false, stdout mode is used - prompts return defaults, static screens print immediately.
   */
  isOpenTUIActive(): boolean {
    return this.renderer !== null
  }

  /**
   * Called by Screen when a prompt becomes active
   * Focuses the screen and switches to content area
   */
  onScreenPromptActivated(screen: ScreenInstance): void {
    this.setActiveScreen(screen)
    this.focusArea = 'content'
    this.notifyChange()
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
    }

    // Update selected index if it's now out of bounds
    const visibleScreens = this.getScreens()
    if (this.selectedIndex >= visibleScreens.length) {
      this.selectedIndex = Math.max(0, visibleScreens.length - 1)
    }

    this.notifyChange()
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
        this.selectedIndex = Math.max(0, visibleScreens.length - 1)
      }
    }

    this.notifyChange()
  }

  /**
   * Check if all screens are successful (or only static) and start auto-close timer if enabled.
   * Static screens are ignored in this calculation.
   * If there are only static screens, the timer will trigger after the delay with no new activity.
   */
  private checkAutoClose(): void {
    const autoClose = this.bindOptions.autoClose
    if (!autoClose || !this.isBound) return

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
    this.activeScreenId = screen.getId()
    this.notifyChange()
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
    this.focusArea = area
    this.notifyChange()
  }

  /**
   * Set selected index in sidebar
   */
  setSelectedIndex(index: number): void {
    const visibleScreens = this.getScreens()
    this.selectedIndex = Math.max(0, Math.min(index, visibleScreens.length - 1))
    this.notifyChange()
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
    this.notifyChange()
  }

  /**
   * Register a change listener for re-renders
   */
  onChange(listener: () => void): () => void {
    this.changeListeners.add(listener)
    return () => this.changeListeners.delete(listener)
  }

  private notifyChange(): void {
    // Check auto-close on every change (resets timer if activity occurs)
    this.checkAutoClose()

    // Notify listeners - React components will forceUpdate and re-render
    this.changeListeners.forEach((listener) => listener())
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
