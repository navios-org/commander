# Changelog

All notable changes to this project will be documented in this file.

> **Warning**: This adapter is **experimental** and **not recommended for production use**. The Solid.js adapter may have stability issues and incomplete features. Consider using `@navios/tui-adapter-ink` or `@navios/tui-adapter-react` for production applications.

## [1.1.0] - 2026-01-16

### Changed

- **ScreenBridge** - Moved message fetching logic to ScreenBridge component for better state management
- **Screen Event Subscriptions** - Added proper screen event subscriptions for reactive updates
- **Content Area** - Improved filter context handling
- **Sidebar Container** - Enhanced sidebar state management
- **Loading Message** - Improved loading indicator component

### Fixed

- **State Synchronization** - Fixed issues with screen state not properly updating

### Notes

- This adapter is **experimental** and **not recommended for production use**
- May have stability issues compared to the Ink adapter
- Best suited for testing and development purposes only

## [1.0.0] - 2025-01-15

### Added

- Initial release as a standalone package
- Extracted from `@navios/commander-tui` to reduce dependency footprint
- `SolidAdapter` class for OpenTUI-based Solid.js rendering
- `LoggerProvider` and `useLoggerContext` for theme context
- `useTheme` accessor for accessing current theme
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
- Uses `@opentui/solid` for terminal rendering
- Solid.js is bundled with this package (not a peer dependency)
