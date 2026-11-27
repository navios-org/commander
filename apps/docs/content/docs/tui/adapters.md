---
title: Adapters
---

# Adapters

An adapter draws the screens. `@navios/commander-tui` holds the screens, their messages and their prompts, and knows nothing about rendering; the adapter is the only part that touches the terminal.

## Which one

| | `@navios/tui-adapter-ink` | `@navios/tui-adapter-react` |
| --- | --- | --- |
| Renders with | [Ink](https://github.com/vadimdemedes/ink) | [OpenTUI](https://github.com/sst/opentui) |
| Runs on | Node.js 24+, Bun | Bun; Node.js 26.4+ started with `--experimental-ffi` |
| Native code | None | Yes |
| Mouse | Scrolling | Scrolling and selection |
| Syntax highlighting | Per line | Tree-sitter |
| Choose it | By default | When you control the runtime and want the richer rendering |

Both draw the same screens from the same state, and a program can switch between them by changing one line.

### Ink

```bash
npm install @navios/tui-adapter-ink@next react
```

```ts
import { inkAdapter } from '@navios/tui-adapter-ink'

tui({ adapter: inkAdapter() })
```

### OpenTUI

```bash
npm install @navios/tui-adapter-react@next react
```

```ts
import { openTuiAdapter } from '@navios/tui-adapter-react'

tui({ adapter: openTuiAdapter() })
```

Where OpenTUI cannot run, the adapter says so and the screens print to standard output:

```console
$ node cli.js build
[commander-tui] The opentui adapter could not start: OpenTUI needs Bun or Node.js 26.4.0+, and this is Node.js 24.22.1. Printing to standard output instead.
```

### Choosing at run time

Import the adapter you need, when you need it. A plain run then never loads a renderer:

```ts
async function adapter() {
  if (!process.stdout.isTTY) {
    return undefined // no interface: nothing to load
  }
  if (process.versions.bun) {
    return (await import('@navios/tui-adapter-react')).openTuiAdapter()
  }
  return (await import('@navios/tui-adapter-ink')).inkAdapter()
}

await runCli(AppModule, { plugins: [tui({ adapter: await adapter() })] })
```

## Writing an adapter

An adapter is an object with a name and one method:

```ts
import type { TuiAdapter } from '@navios/commander-tui'

export function myAdapter(): TuiAdapter {
  return {
    name: 'mine',
    // Optional. `false`, or a string that says why not, falls back to standard output.
    isSupported: () => process.stdout.columns >= 60 || 'the terminal is too narrow',
    async mount({ manager, theme, options }) {
      const view = await startRendering(manager, theme, options)
      return {
        // Give the terminal back: main screen, cursor, mouse reporting.
        // What is printed after this resolves must not be lost.
        unmount: () => view.stop(),
      }
    },
  }
}
```

`mount()` receives:

| | |
| --- | --- |
| `manager` | The `ScreenManagerInstance`: `getScreens()`, `getActiveScreen()`, the focus and the selection, and events such as `screen:added` and `activeScreen:changed`. |
| `theme` | The theme the program configured, if any. |
| `options` | The options the interface was bound with: `sidebar`, `mouse`, `exitOnCtrlC`. |

Each `ScreenInstance` has `getMessages()`, `getActivePrompt()` and events such as `message:added`, `message:updated` and `prompt:activated`.

An adapter that closes by itself, for instance on Ctrl+C, calls `manager.unbind()` so that the manager stops drawing and prints what the screens held.

### With React

`@navios/commander-tui/react` has the hooks both built-in adapters use. They subscribe to the manager and the screens with `useSyncExternalStore`, and know nothing about a renderer:

```tsx
import { useActiveScreen, useScreenList, useScreenMessages } from '@navios/commander-tui/react'

function App({ manager }: { manager: ScreenManagerInstance }) {
  const screens = useScreenList(manager) // changes with visibility, status and badges
  const active = useActiveScreen(manager)
  const messages = useScreenMessages(active) // a burst of logs renders once

  return <YourLayout screens={screens} messages={messages} />
}
```

| Hook | Returns |
| --- | --- |
| `useScreenList(manager)` | The visible screens, in display order |
| `useActiveScreen(manager)` | The screen in view |
| `useFocusArea(manager)`, `useSidebarIndex(manager)` | Where the focus and the selection are |
| `useScreenMessages(screen)` | The messages of a screen |
| `useActivePrompt(screen)` | The prompt a screen is asking |
| `useMessageUpdate(screen, id, initial)` | One message that changes in place, such as a progress bar |
| `useFilterState()` | The state of a filter bar and its actions |

For the keys, `KeyboardManager` and `createDefaultBindings()` of `@navios/commander-tui` map key events to actions on the manager; an adapter translates its renderer's key events into `{ name, ctrl, meta, shift }` and passes them on.
