# @navios/tui-adapter-react

React adapter for `@navios/commander-tui` using OpenTUI renderer.

> **Important**: This adapter only works with **Bun**. It is not compatible with Node.js due to OpenTUI's runtime requirements.

## Installation

```bash
bun add @navios/commander-tui @navios/tui-adapter-react
```

## Requirements

- **Bun** runtime (Node.js is not supported)
- `@navios/commander-tui` ^1.3.0
- `@navios/core` \*

## Usage

Simply import the adapter to register it with the DI container:

```typescript
import '@navios/tui-adapter-react'
import { ScreenManager } from '@navios/commander-tui'

// The React adapter is now automatically used for TUI rendering
```

## What's Included

This package provides:

- `ReactAdapter` - The adapter class that handles React/OpenTUI rendering
- `LoggerProvider` - Context provider for theme and syntax highlighting
- `useLoggerContext` - Hook to access logger context
- `useTheme` - Hook to access the current theme
- `useFilterState` - Hook for managing filter state
- `useKeyboardManager` - Hook for keyboard input handling
- `useManagerSubscription` - Hook for subscribing to screen manager changes

## Why Bun Only?

This adapter uses `@opentui/react` which relies on Bun-specific features for its terminal rendering engine. The OpenTUI library provides advanced terminal UI capabilities that are optimized for the Bun runtime.

If you need Node.js compatibility, consider using `@navios/tui-adapter-ink` instead, which provides similar functionality using the Ink library.

## Related Packages

- `@navios/commander-tui` - Core TUI package (required)
- `@navios/tui-adapter-solid` - Solid.js adapter (Bun only)
- `@navios/tui-adapter-ink` - Ink adapter (Node.js compatible)

## License

MIT
