---
title: Terminal interface
---

# Terminal interface

`@navios/commander-tui` gives a program *screens*: named areas that collect logs, progress bars, tables, file diffs and prompts. In a terminal an adapter draws them, with a sidebar to switch between them. Without a terminal, in CI or behind a pipe, the same calls print plain lines.

```
┌ My CLI ───────────┬──────────────────────────────────────────────┐
│ > ● Build         │ Build                                        │
│   ✓ Deploy        │ 14:02:11 [Build] Starting production build   │
│   ○ Log           │   Building [████████████░░░░░░░░]  60% (3/5) │
│                   │                                              │
└───────────────────┴──────────────────────────────────────────────┘
```

You write to a screen through a logger. Nothing in a command knows whether an interface is shown.

## Install

```bash
npm install @navios/commander-tui@next @navios/tui-adapter-ink@next react
```

`@navios/tui-adapter-ink` draws with [Ink](https://github.com/vadimdemedes/ink) and runs wherever Node.js does. [Adapters](/docs/tui/adapters) compares it with the OpenTUI adapter.

## Switch it on

Add the `tui()` plugin to the program:

```ts title="cli.ts"
import { runCli } from '@navios/commander'
import { tui } from '@navios/commander-tui'
import { inkAdapter } from '@navios/tui-adapter-ink'

await runCli(AppModule, {
  name: 'mycli',
  plugins: [tui({ adapter: inkAdapter(), sidebar: { title: 'My CLI' } })],
})
```

The interface opens when the application has started and closes when it does. When it closes, everything the screens showed is printed to standard output, so the result is still in the scrollback.

## Write to a screen

```ts
import { Command } from '@navios/commander'
import { ScreenLogger } from '@navios/commander-tui'
import { inject } from '@navios/core'

@Command({ path: 'build', description: 'Build the project' })
export class BuildCommand {
  private readonly logger = inject(ScreenLogger, { screen: 'Build', context: 'Build' })

  async execute() {
    this.logger.log('Starting build...')

    const steps = ['Resolving', 'Compiling', 'Bundling']
    const progress = this.logger.progress('Building', { total: steps.length })
    for (const [index, step] of steps.entries()) {
      progress.update(index, step)
      await work(step)
    }
    progress.complete('Build finished')

    this.logger.success('Done')
  }
}
```

`screen: 'Build'` names the screen. It is created the first time something asks for it; every logger and prompt that names it writes to the same one.

## The three ways it shows

| Where the program runs | What happens |
| --- | --- |
| In a terminal, with an adapter | The adapter draws the screens. Prompts are answered in the interface. |
| In a terminal, without an adapter, or with one that cannot run here | Messages are printed as they come. Prompts are asked with readline. |
| Without a terminal: a pipe, a file, CI | Messages are printed as they come, without colours. Prompts answer with their defaults. |

Colours are used on a terminal only. `NO_COLOR=1` switches them off there too, and `FORCE_COLOR=1` switches them on everywhere.

:::warning
Where nobody can answer, a prompt resolves with its default. The default of `confirm()` is **no**, so "Delete everything?" is never answered with yes by a CI run. Set `defaultValue: true` only for questions where yes is the safe answer.
:::

## Options of `tui()`

| Option | Meaning |
| --- | --- |
| `adapter` | What draws the screens. Without one, the screens print to standard output. |
| `theme` | `'dark'` (default), `'light'`, `'high-contrast'`, or a theme object. |
| `sidebar` | `{ title, width, position: 'left' \| 'right' }`. |
| `mouse` | Whether the mouse scrolls. Default `true`. |
| `exitOnCtrlC` | Whether Ctrl+C ends the program while the interface is shown. Default `true`. |
| `autoClose` | Close the interface once every screen with a status has succeeded: `true` for 5 seconds, or milliseconds. For programs that keep running; under `runCli()` the interface closes with the command anyway. |
| `logLevels` | The levels that are shown at all. |
| `logScreen` | The screen for the application's own log: `{ name, icon, hidden }`, or `false` to leave the log on the console. |

### The application's log

Everything written with `Logger` of `@navios/core` goes to a screen called `Log`. Hide it until something goes wrong:

```ts
tui({ adapter: inkAdapter(), logScreen: { hidden: true } })
```

A hidden log screen shows itself when an error is logged.

## Keys

| Key | Does |
| --- | --- |
| `Tab`, `\` | Move the focus between the sidebar and the content |
| `↑` `↓`, `k` `j` | Move in the sidebar or in a prompt |
| `Enter` | Open the selected screen, or submit a prompt |
| `1`–`9` | Jump to a screen |
| `/` | Filter the messages: search text, and with `Tab` the log levels |
| `c` | Clear the screen |
| `?` | Show all keys |
| `q` | Close the interface |

## Next

- [Screens and logs](/docs/tui/screens-and-logs): statuses, progress, tables, files and diffs.
- [Prompts](/docs/tui/prompts): questions with choices, confirmation and text.
- [Adapters](/docs/tui/adapters): Ink or OpenTUI, and writing your own.
