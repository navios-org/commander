# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0-alpha.0] - 2026-11-27

For `@navios/commander-tui` 2.0.

### Breaking

- **`openTuiAdapter()` replaces the `ReactAdapter` class.** Pass it to `tui({ adapter: openTuiAdapter() })` or `manager.bind({ adapter })`. Importing the package no longer registers anything.
- The adapter creates and destroys the OpenTUI renderer itself. `@navios/commander-tui` no longer does, and has no OpenTUI dependency.
- `react` is a peer dependency instead of a dependency, so that an application has one copy. `web-tree-sitter`, which nothing imported, is no longer a dependency. `@navios/core` is no longer a peer dependency.

### Added

- `openTuiSupport()`: whether OpenTUI can run in this process, or the reason why not. The reason is printed when the adapter falls back to standard output.

### Fixed

- The background of the active sidebar item was an invalid colour with the dark theme, and was drawn magenta.
- The sidebar position (`sidebar.position: 'right'`) is honoured.
- A progress value beyond the total no longer crashes the interface.
- A renderer that was created but could not be given a root is destroyed, instead of leaving the terminal in the alternate screen.

## [2.0.0] - 2026-11-23

### Breaking Changes

- **OpenTUI 0.9** - Upgraded `@opentui/core` and `@opentui/react` from 0.1.73 to ^0.9.7. Requires Bun >=1.3.14 (or Node.js >=26.4 with `--experimental-ffi`).
- **Custom `SyntaxStyle`** - OpenTUI 0.9 requires an owner: create it with `SyntaxStyle.create(renderer.nativeScene)` before passing it to `LoggerProvider`.
- **Requires `@navios/commander-tui` ^1.7.0** - That release waits for OpenTUI 0.9 to restore the terminal before printing screens on exit.
- **ESM-only** - The CommonJS build is removed. It never loaded (`@opentui/react` is an async ES module).

### Fixed

- **Syntax highlighting** - `web-tree-sitter` (required by `@opentui/core` for `<code>`/`<diff>` highlighting) is now a dependency.

### Changed

- **Node.js** - Used automatically on Node.js 26.4+ started with `--experimental-ffi`, together with `@navios/commander-tui` 1.7+ (and `@navios/commander` 1.9+).
- **Removed `bun-plugin.mts`** - The Bun preload that lowered decorators is gone. Bun runs standard decorators natively, and the plugin had started breaking `.tsx` loading.
- **`LoggerProvider`** - Creates its default `SyntaxStyle` from the surrounding OpenTUI renderer. Outside a renderer, `syntaxStyle` is `undefined`.
- **Rendering** - The scrollbar is hidden when content fits, content padding is applied, and diff line numbers count blank context lines (OpenTUI 0.9 behaviour).
- **React** - Updated to ^19.3.1.

## [1.2.0] - 2026-01-16

### Added

- **Store Hooks** - New reactive hooks for state management:
  - `useScreenStore` - Subscribe to screen state changes
  - `useManagerStore` - Subscribe to screen manager state changes
  - `useMessageUpdate` - Subscribe to message updates with auto-refresh
- **Integration Tests** - Comprehensive integration tests for:
  - Screen logger functionality
  - Screen manager behavior
  - File message rendering
  - Interactive prompts

### Changed

- **Component Simplification** - Simplified progress message color logic with helper functions
- **Sidebar Container** - Removed unnecessary `useMemo`, improved early return pattern
- **Screen Bridge** - Enhanced screen bridge component
- **Group Renderer** - Updated for improved message rendering
- **Loading Message** - Refined loading indicator behavior
- **Message Renderer** - Improved message display logic
- **Content Area** - Enhanced content rendering

## [1.1.0] - 2026-01-16

### Changed

- **Dependencies** - Updated package dependencies

## [1.0.0] - 2025-01-15

### Added

- Initial release as a standalone package
- Extracted from `@navios/commander-tui` to reduce dependency footprint
- `ReactAdapter` class for OpenTUI-based React rendering
- `LoggerProvider` and `useLoggerContext` for theme context
- `useTheme` hook for accessing current theme
- `useFilterState` hook for log filtering state management
- `useKeyboardManager` hook for keyboard input handling
- `useManagerSubscription` hook for reactive updates
- Full component library for TUI rendering:
  - Screen management and navigation
  - Log message display with level-based styling
  - File content and diff viewing with syntax highlighting
  - Interactive prompts (choice, confirm, input, multi-choice)
  - Filter bar for log filtering
  - Help overlay with keyboard shortcuts
  - Sidebar for multi-screen navigation

### Notes

- This package only works with **Bun** runtime
- Requires `@navios/commander-tui` ^1.3.0 as peer dependency
- Uses `@opentui/react` for terminal rendering
