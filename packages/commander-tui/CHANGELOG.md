# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
