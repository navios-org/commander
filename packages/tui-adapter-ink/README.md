# @navios/tui-adapter-ink

Ink adapter for `@navios/commander-tui` with fullscreen terminal support.

> **Node.js Compatible**: This adapter works with both **Node.js** and **Bun** runtimes.

## Installation

```bash
# Using npm
npm install @navios/commander-tui @navios/tui-adapter-ink

# Using yarn
yarn add @navios/commander-tui @navios/tui-adapter-ink

# Using bun
bun add @navios/commander-tui @navios/tui-adapter-ink
```

## Requirements

- Node.js 18+ or Bun
- `@navios/commander-tui` ^1.3.0
- `@navios/core` \*

## Usage

Simply import the adapter to register it with the DI container:

```typescript
import '@navios/tui-adapter-ink'
import { ScreenManager } from '@navios/commander-tui'

// The Ink adapter is now automatically used for TUI rendering
```

## What's Included

This package provides:

- `InkAdapter` - The adapter class that handles Ink-based rendering
- `LoggerProvider` - Context provider for theme configuration
- `useLoggerContext` - Hook to access logger context
- `useTheme` - Hook to access the current theme
- `useFilterState` - Hook for managing filter state
- `useKeyboardManager` - Hook for keyboard input handling
- `useManagerSubscription` - Hook for subscribing to screen manager changes

## Features

- **Fullscreen Mode**: Uses alternate screen buffer for clean terminal experience
- **Node.js Compatible**: Unlike the React/Solid adapters, this works on Node.js
- **Rich Terminal UI**: Supports colors, borders, and text styling via Ink
- **Syntax Highlighting**: Code blocks with syntax highlighting via `ink-syntax-highlight`
- **Virtual Lists**: Efficient rendering of large lists via `ink-virtual-list`

## When to Use This Adapter

Choose `@navios/tui-adapter-ink` when:

- You need **Node.js compatibility**
- You want a battle-tested terminal UI library
- You're building tools that need to run in standard Node.js environments
- You prefer the Ink ecosystem and its plugins

Choose `@navios/tui-adapter-react` or `@navios/tui-adapter-solid` when:

- You're running on **Bun** runtime
- You want more advanced terminal rendering capabilities via OpenTUI
- You need features specific to OpenTUI's renderer

## Related Packages

- `@navios/commander-tui` - Core TUI package (required)
- `@navios/tui-adapter-react` - React/OpenTUI adapter (Bun only)
- `@navios/tui-adapter-solid` - Solid.js/OpenTUI adapter (Bun only)

## License

MIT
