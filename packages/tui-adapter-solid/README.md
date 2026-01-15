# @navios/tui-adapter-solid

Solid.js adapter for `@navios/commander-tui` using OpenTUI renderer.

> **Important**: This adapter only works with **Bun**. It is not compatible with Node.js due to OpenTUI's runtime requirements.

## Installation

```bash
bun add @navios/commander-tui @navios/tui-adapter-solid
```

## Requirements

- **Bun** runtime (Node.js is not supported)
- `@navios/commander-tui` ^1.3.0
- `@navios/core` *

## Usage

Simply import the adapter to register it with the DI container:

```typescript
import '@navios/tui-adapter-solid'
import { ScreenManager } from '@navios/commander-tui'

// The Solid adapter is now automatically used for TUI rendering
```

## What's Included

This package provides:

- `SolidAdapter` - The adapter class that handles Solid.js/OpenTUI rendering
- `LoggerProvider` - Context provider for theme and syntax highlighting
- `useLoggerContext` - Accessor to access logger context
- `useTheme` - Accessor to access the current theme

## Why Bun Only?

This adapter uses `@opentui/solid` which relies on Bun-specific features for its terminal rendering engine. The OpenTUI library provides advanced terminal UI capabilities that are optimized for the Bun runtime.

If you need Node.js compatibility, consider using `@navios/tui-adapter-ink` instead, which provides similar functionality using the Ink library.

## Why Choose Solid.js?

Solid.js offers fine-grained reactivity without a virtual DOM, which can provide:

- More efficient updates for terminal UI
- Smaller bundle size compared to React
- Familiar JSX syntax with reactive primitives

## Related Packages

- `@navios/commander-tui` - Core TUI package (required)
- `@navios/tui-adapter-react` - React adapter (Bun only)
- `@navios/tui-adapter-ink` - Ink adapter (Node.js compatible)

## License

MIT
