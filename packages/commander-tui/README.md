# @navios/commander-tui

Screens for command line programs: named areas that collect logs, progress bars, tables, file
diffs and prompts. In a terminal an adapter draws them with a sidebar to switch between them.
Without a terminal, in CI or behind a pipe, the same calls print plain lines.

> 2.0 is in alpha and not compatible with 1.x. See
> [Migrating to 2.0](../../apps/docs/content/docs/reference/migrating-to-2.md).

## Install

```bash
npm install @navios/commander-tui@next @navios/tui-adapter-ink@next react
```

## Use

```ts
import { Command, runCli } from '@navios/commander'
import { Prompt, ScreenLogger, tui } from '@navios/commander-tui'
import { inject, Module } from '@navios/core'
import { inkAdapter } from '@navios/tui-adapter-ink'

@Command({ path: 'build', description: 'Build the project' })
class BuildCommand {
  private readonly logger = inject(ScreenLogger, { screen: 'Build' })
  private readonly prompt = inject(Prompt, { screen: 'Build' })

  async execute() {
    if (!(await this.prompt.confirm({ question: 'Build for production?' }))) {
      return
    }
    const progress = this.logger.progress('Building', { total: 3 })
    for (let step = 1; step <= 3; step++) {
      await work(step)
      progress.update(step)
    }
    progress.complete('Built')
    this.logger.success('Done')
  }
}

@Module({ commands: [BuildCommand] })
class AppModule {}

await runCli(AppModule, {
  plugins: [tui({ adapter: inkAdapter(), sidebar: { title: 'My CLI' } })],
})
```

The `tui()` plugin opens the interface when the application has started, sends the application's
log to a screen of its own, and prints what the screens held when the interface closes.

## What is in it

- `ScreenLogger`: `log`, `success`, `warn`, `error`, `debug`, `trace`, `loading`, `promise`,
  `progress`, `table`, `group`, `file`, `diff`, `fileError`.
- `Prompt`: `confirm`, `choice`, `input`, `multiChoice`, each with an optional `timeout`. Where
  nobody can answer, a prompt resolves with its default, and the default of `confirm` is no.
- `Screen`: status (`pending`, `success`, `fail`), badge, visibility, and a bound on the messages
  it keeps (`maxMessages`).
- Themes: `dark`, `light`, `high-contrast`, or your own with `createTheme()`.
- `@navios/commander-tui/react`: the hooks the adapters are built with, for writing your own.

## Adapters

| Package                     | Renders with | Runs on                                      |
| --------------------------- | ------------ | -------------------------------------------- |
| `@navios/tui-adapter-ink`   | Ink          | Node.js 24+, Bun                             |
| `@navios/tui-adapter-react` | OpenTUI      | Bun; Node.js 26.4+ with `--experimental-ffi` |

## Documentation

[Terminal interface](../../apps/docs/content/docs/tui/index.md) in the documentation of this
repository.

## License

MIT
