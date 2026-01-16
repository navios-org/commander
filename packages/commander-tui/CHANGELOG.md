# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
