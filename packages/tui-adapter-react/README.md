# @navios/tui-adapter-react

React adapter for `@navios/commander-tui` using OpenTUI renderer.

> **Runtime**: Works out of the box on **Bun**. **Node.js 26.4+** is supported by OpenTUI with caveats — see [Running on Node.js](#running-on-nodejs). For older Node.js versions, use `@navios/tui-adapter-ink`.

## Installation

```bash
bun add @navios/commander-tui @navios/tui-adapter-react
```

## Requirements

- **Bun** 1.3.14+, or **Node.js** 26.4+ with `--experimental-ffi` (see below)
- ES modules — the package has no CommonJS build
- `@navios/commander-tui` ^1.7.0
- `@navios/core` \*

## Usage

Simply import the adapter to register it with the DI container:

```typescript
import '@navios/tui-adapter-react'
import { ScreenManager } from '@navios/commander-tui'

// The React adapter is now automatically used for TUI rendering
```

With `@navios/commander`, selecting the adapter is enough — the factory loads it for you:

```typescript
const app = await CommanderFactory.create(AppModule, {
  enableTUI: true,
  tuiOptions: { adapter: 'react' },
})
```

## Running on Node.js

OpenTUI renders through native FFI. On Bun that is built in; on Node.js it depends on the still-experimental `node:ffi` module, which brings a few caveats:

- **Node.js 26.4 or later.** Earlier versions have no `node:ffi`, so the TUI is not used and output goes to stdout.
- **Start Node with `--experimental-ffi`**, e.g. `node --experimental-ffi ./cli.mjs` or `NODE_OPTIONS=--experimental-ffi`. Without the flag `node:ffi` is unavailable and output goes to stdout as well.
- **ES modules only.** Load the adapter with `import`; `require()` fails because OpenTUI's modules use top-level await.
- **Picked automatically.** `@navios/commander-tui` 1.7+ checks whether OpenTUI can run (Bun, or Node.js 26.4+ with `node:ffi` available) and uses the TUI by default when it can; otherwise it prints to stdout. `@navios/commander` 1.9+ likewise loads this adapter on Node.js when it is selected with `tuiOptions: { adapter: 'react' }`. Pass `useOpenTUI: false` to force stdout output.

## What's Included

This package provides:

- `ReactAdapter` - The adapter class that handles React/OpenTUI rendering
- `LoggerProvider` - Context provider for theme and syntax highlighting
- `useLoggerContext` - Hook to access logger context
- `useTheme` - Hook to access the current theme
- `useFilterState` - Hook for managing filter state
- `useKeyboardManager` - Hook for keyboard input handling
- `useManagerSubscription` - Hook for subscribing to screen manager changes

A custom `SyntaxStyle` passed to `LoggerProvider` must be created with an owner, e.g. `SyntaxStyle.create(renderer.nativeScene)` (OpenTUI 0.6+).

## Related Packages

- `@navios/commander-tui` - Core TUI package (required)
- `@navios/tui-adapter-solid` - Solid.js adapter (OpenTUI, same runtime requirements)
- `@navios/tui-adapter-ink` - Ink adapter (Node.js 22+ and Bun)

## License

MIT
