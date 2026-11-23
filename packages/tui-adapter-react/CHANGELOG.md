# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-11-23

### Breaking Changes

- **OpenTUI 0.9** - Upgraded `@opentui/core` and `@opentui/react` from 0.1.73 to ^0.9.7. Requires Bun >=1.3.14 (or Node.js >=26.4 with `--experimental-ffi`).
- **Custom `SyntaxStyle`** - OpenTUI 0.9 requires an owner: create it with `SyntaxStyle.create(renderer.nativeScene)` before passing it to `LoggerProvider`.
- **Requires `@navios/commander-tui` ^1.7.0** - That release waits for OpenTUI 0.9 to restore the terminal before printing screens on exit.
- **ESM-only** - The CommonJS build is removed. It never loaded (`@opentui/react` is an async ES module).

### Fixed

- **Syntax highlighting** - `web-tree-sitter` (required by `@opentui/core` for `<code>`/`<diff>` highlighting) is now a dependency.

### Changed

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
