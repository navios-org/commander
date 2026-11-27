# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-alpha.0] - 2026-11-27

For `@navios/core` 2.0. See the migration guide in `apps/docs/content/docs/reference/migrating-to-2.md`.

### Breaking

- **Adapters are passed, not imported for a side effect.** The contract is `TuiAdapter`: a `name`, an optional `isSupported()` and `mount({ manager, theme, options })`, which returns `{ unmount() }`. `AdapterInterface`, `AdapterRoot`, `handlesOwnRenderer` and `MissingAdapterOverride` are removed.
- **`@opentui/core` is no longer a peer dependency.** The renderer is created by `@navios/tui-adapter-react`. `useOpenTUI`, `isOpenTUISupported()`, `isBunRuntime()` and `dynamicImport()` are removed.
- **`overrideConsoleLogger()` and `IsomorphicLogger` are removed.** The `tui()` plugin routes the application's log to a screen; `ScreenLogger` works without an interface.
- **Bind options**: `sidebarWidth`, `sidebarPosition` and `sidebarTitle` are `sidebar: { width, position, title }`, and `useMouse` is `mouse`.
- **`prompt.confirm()` defaults to no.** It defaulted to yes, which runs without a terminal then answered.
- `choice()` throws for a `defaultChoice` that is not among the choices.
- `file()`, `diff()` and `fileError()` are shown at the `log` level instead of `debug`. `loading()`, `progress()`, `promise()`, `group()` and `table()` respect the levels too.
- `isTuiBound()`, `isTuiRendererActive()` and `isOpenTUIActive()` are removed; use `isInteractive()` and `hasTuiRenderer()`.
- The component prop types that referred to React and OpenTUI (`ScreenProps`, `ScreenManagerProps`, `LogMessageProps`, `LoggerContextValue`) moved to the adapters or are removed. Colours in the remaining types are strings.
- Node.js 24 or later; `zod` is now a declared dependency.

### Added

- `tui(options)`: a plugin for `createApplication()` and `runCli()` that provides the adapter, opens the interface when the application has started and closes it with the application.
- `@navios/commander-tui/react`: the store hooks both adapters used to carry a copy of.
- `maxMessages` for screens, 10 000 by default. A screen used to keep every message for the life of the process.
- `NO_COLOR` and `FORCE_COLOR` are honoured, and output that is not a terminal gets no colour codes.
- `screen.getMessage(id)`, `screen.getMessagesVersion()`, `logger.getScreen()`.

### Fixed

- The Ink adapter was only used where OpenTUI could run, so on Node.js before 26.4 it fell back to standard output.
- An adapter that failed to start was reported as "not available", whatever the error was. The reason is printed now.
- Two `bind()` calls created two renderers, and `unbind()` during `bind()` could leave the interface up. Both are serialised.
- Prompts never resolved when the interface closed or their screen was removed. They resolve with their defaults.
- The timeout of a prompt ran while the prompt waited behind another one.
- A prompt on a hidden screen made a screen active that nobody could see.
- `autoClose` was not armed for screens that had finished before `bind()`, and its timer kept the process alive.
- A static screen that was given a status printed all its messages a second time; a finished screen stopped printing later messages.
- The digits toggled log levels while the search field of the filter had the focus, so they could not be searched for; the hint named seven levels where there are six.
- `progress.update()` beyond the total crashed the interface.
- More than ten loading or progress rows printed a `MaxListenersExceededWarning` over the interface.
- A screen that logged while another one was in view showed stale messages when switched back to.
- The sidebar did not repaint when a screen was shown, hidden, or changed its status or badge.
- A burst of log lines rendered once per line; it now renders once.

## [1.7.0] - 2026-11-23

### Added

- **OpenTUI on Node.js** - `bind()` now uses the TUI by default wherever OpenTUI can run: Bun, or Node.js 26.4+ started with `--experimental-ffi`. Before, the default was Bun only. New helper: `isOpenTUISupported()`.
- **`@opentui/core` peer dependency** - Declared `@opentui/core` ^0.9.7 as an optional peer dependency. It was already used by the published types and the default renderer, but was not declared.

### Changed

- **OpenTUI 0.9** - The renderer is created with `screenMode: 'alternate-screen'` (OpenTUI removed `useAlternateScreen`).

### Fixed

- **Terminal restore on exit** - `unbind()` now waits for the OpenTUI renderer to finish restoring the terminal (`renderer.closed`) before flushing screens to stdout, and still prints them if that restore fails.

## [1.6.2] - 2026-01-28

### Fixed

- **Non-interactive TTY handling** - Also check `process.stdin.isTTY` to ensure input is available for interactive prompts

## [1.6.1] - 2026-01-26

### Fixed

- **Non-interactive TTY handling** - `bind()` now checks for TTY availability and stays in UNBOUND mode when running in non-interactive environments (CI, piped output), ensuring prompts return defaults and screens print on completion

## [1.6.0] - 2026-01-16

### Changed

- **Screen Options Schema** - Updated screen options schema for improved configuration
- **Logger Service** - Enhanced logger service with refined logging behavior
- **Screen Service** - Improved screen service state management
- **Screen Manager** - Refined screen manager for better adapter integration
- **Adapter Interface** - Updated adapter interface for improved hook support

## [1.5.0] - 2026-01-16

### Changed

- **Screen Service** - Enhanced screen event subscriptions in ScreenBridge
- **Screen Manager** - Improved message fetching logic moved to ScreenBridge component

### Fixed

- **Solid Adapter Integration** - Fixed screen event subscriptions for proper state synchronization

## [1.4.0] - 2026-01-15

### Added

- **Event Types** - New `events.types.ts` module with typed event definitions for screen and prompt interactions
- **Readline Prompt Service** - New `ReadlinePromptService` for handling interactive prompts in non-TUI environments
- **Prompt Utilities** - New `prompt.ts` utility module for prompt-related helper functions

### Changed

- **Adapter Extraction** - UI framework adapters moved to dedicated packages:
  - `@navios/tui-adapter-ink` - Ink/React terminal adapter (new)
  - `@navios/tui-adapter-react` - OpenTUI React web adapter (new)
  - `@navios/tui-adapter-solid` - OpenTUI Solid.js web adapter (new)
- **Screen Manager** - Refactored to support external adapter packages via `TuiAdapterInterface`
- **Screen Service** - Enhanced with new event handling and state management
- **Build Configuration** - Simplified to single TypeScript config, removed framework-specific configs
- **Package Dependencies** - Removed direct UI framework dependencies (now in adapter packages)

### Removed

- **Built-in Adapters** - Removed `src/adapters/` directory (moved to separate packages)
- **Framework-specific Configs** - Removed `tsconfig.ink.json`, `tsconfig.react.json`, `tsconfig.solid.json`
- **Component Tests** - Removed component-level tests (moved to adapter packages)

## [1.3.0] - 2026-01-13

### Added

- **Framework Adapter Architecture** - TUI components are now framework-agnostic with dedicated adapters
  - New `TuiAdapterInterface` for framework-agnostic TUI rendering
  - `@navios/commander-tui/adapters/react` - React adapter (default, uses @opentui/react)
  - `@navios/commander-tui/adapters/solid` - Solid.js adapter (optional, uses @opentui/solid)
- **Solid.js Support** - Full Solid.js implementation of all TUI components
  - All components ported: Sidebar, Screen, Log, Prompt, Filter, Help, File display
  - SolidJS-specific patterns with reactive signals and proper type narrowing
  - Optional peer dependency on `solid-js`
- **Adapter Token** - New `TuiAdapterToken` for injecting the active TUI adapter
- **Screen Manager Token** - New `ScreenManagerToken` for service injection

### Changed

- **Component Organization** - Components moved from `src/components/` to `src/adapters/react/components/`
- **Context Organization** - Context providers moved to `src/adapters/react/context/`
- **Hooks Organization** - Hooks moved to `src/adapters/react/hooks/`
- **Screen Manager** - Refactored to use adapter interface instead of direct React rendering
- **Build Configuration** - Separate TypeScript configs for React and Solid builds

### Fixed

- **Type Safety** - Solid adapter uses proper SolidJS type narrowing patterns instead of `as any` casts

## [1.2.0] - 2026-01-11

### Added

- **Isomorphic Logger** - New `IsomorphicLogger` token and factory for unified logging across TUI and server environments
  - `IsomorphicLoggerInterface` type that works with both `ScreenLogger` (TUI) and standard `Logger` (server)
  - `IsomorphicLoggerFactory` automatically selects the appropriate logger based on TUI availability
- **Interfaces Export** - New `interfaces` module export for public type definitions

### Changed

- **Mouse Support Default** - `useMouse` option now defaults to `true` (previously `false`)

### Fixed

- **Stack Trace Capture** - Improved `captureTrace()` to dynamically find the correct stack frame offset, ensuring accurate trace output regardless of call depth

## [1.1.0] - 2026-01-10

### Added

- **Static screen status** - New `static` status for screens that persist without affecting auto-close behavior
- **Static screen option** - `static: boolean` option in screen configuration to mark screens as static
- **Logger setup method** - Added `setup()` method to console logger override for configuring log levels

### Changed

- **Auto-close behavior** - Static screens are now excluded from auto-close calculations. Auto-close triggers when all non-static screens succeed, or after delay if only static screens exist
- **Console logger screen** - Default console logger screen renamed from 'default' to 'internal' and marked as static
- **Auto-close timer** - Timer now resets on any screen activity via `notifyChange()`

### Fixed

- **Theme consistency** - Added `static` status indicator to all themes (dark, light, high-contrast)

## [1.0.0] - 2025-01-10

### Added

- **ScreenManager** - Terminal UI lifecycle management with theme support
- **ScreenLogger** - Rich logging with multiple levels (log, debug, warn, error, success, trace, fatal)
- **Prompt** - Interactive prompts (confirm, choice, multi-choice, input) with timeout support
- **Loading indicators** - Spinner-based loading with manual and promise-based resolution
- **Progress bars** - Visual progress tracking with completion/failure states
- **Tables** - Formatted table output with headers and borders
- **Log groups** - Collapsible log grouping for organized output
- **File display** - Syntax-highlighted file content and diff views
- **Multi-screen support** - Sidebar navigation between multiple screens
- **Theming** - Built-in dark, light, and high-contrast themes
- **Keyboard navigation** - Configurable keyboard bindings for UI interaction
- **Filter engine** - Log filtering by level, content, and context
- **Stdout printing** - Fallback printing when TUI is not available
- **Dependency injection** - Seamless integration with `@navios/core` container
