# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-01-16

### Added

- **Screen Context** - New `ScreenContext` for sharing screen state across components
- **Fullscreen Support** - New fullscreen module with `FullscreenBox`, `useScreenSize`, and `withFullscreen` HOC
- **Store Hooks** - New reactive hooks for state management:
  - `useScreenStore` - Subscribe to screen state changes
  - `useManagerStore` - Subscribe to screen manager state changes
  - `useMessageUpdate` - Subscribe to message updates with auto-refresh
- **Integration Tests** - Comprehensive integration tests for screen logger and screen manager

### Changed

- **Component Simplification** - Simplified progress message color logic with helper functions
- **Sidebar Container** - Removed unnecessary `useMemo`, improved early return pattern
- **Screen Bridge** - Enhanced with new context integration
- **Group Renderer** - Updated for improved message rendering
- **Loading Message** - Refined loading indicator behavior
- **Message Renderer** - Improved message display logic
- **Content Area** - Enhanced content rendering
- **Help Overlay** - Updated help overlay styling

## [1.1.0] - 2026-01-16

### Changed

- **Dependencies** - Updated package dependencies

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
