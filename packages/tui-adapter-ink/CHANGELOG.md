# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-15

### Added

- Initial release as a standalone package
- Extracted from `@navios/commander-tui` to reduce dependency footprint
- `InkAdapter` class for Ink-based terminal rendering
- Fullscreen support via `fullscreen-ink` (alternate screen buffer)
- `LoggerProvider` and `useLoggerContext` for theme context
- `useTheme` hook for accessing current theme
- `useFilterState` hook for log filtering state management
- `useKeyboardManager` hook for keyboard input handling
- `useManagerSubscription` hook for reactive updates
- Full component library for TUI rendering:
  - Screen management and navigation
  - Log message display with level-based styling
  - File content viewing
  - Interactive prompts (choice, confirm, input, multi-choice)
  - Filter bar for log filtering
  - Help overlay with keyboard shortcuts
  - Sidebar for multi-screen navigation

### Notes

- This package works with both **Node.js** and **Bun** runtimes
- Requires `@navios/commander-tui` ^1.3.0 as peer dependency
- Uses Ink for terminal rendering (React-based but not OpenTUI)
- Recommended for Node.js environments where OpenTUI adapters won't work
