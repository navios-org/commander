---
title: Screens and logs
---

# Screens and logs

## Loggers

A `ScreenLogger` writes to one screen. Inject it with the name of the screen:

```ts
import { ScreenLogger } from '@navios/commander-tui'

private readonly logger = inject(ScreenLogger, { screen: 'Deploy', context: 'Deploy' })
```

| Option | Meaning |
| --- | --- |
| `screen` | The name of the screen, or its [options](#screen-options). Defaults to `'default'`. |
| `context` | A label shown before each message. |
| `enabledLevels` | The levels this logger writes. Defaults to all. |

Outside of a class, ask the container: `await container.get(ScreenLogger, { screen: 'Deploy' })`.

### Messages

```ts
logger.log('Uploading artifacts')
logger.success('Deployed') // a log message, shown as a success
logger.warn('Dry run: nothing will change')
logger.error('Health check failed')
logger.debug({ region: 'eu-west-1', replicas: 3 }) // objects are formatted
logger.trace('Called from here') // with a stack, at the verbose level
```

The levels are `verbose`, `debug`, `log`, `warn`, `error` and `fatal`. Every method returns the logger, so calls can be chained.

### Something that takes time

```ts
// A spinner that becomes a result
const loading = logger.loading('Connecting...')
loading.success('Connected') // or loading.fail('Could not connect')

// The same around a promise
const user = await logger.promise(fetchUser(id), {
  loading: 'Fetching user...',
  success: (user) => `Fetched ${user.name}`,
  error: (error) => `Failed: ${error.message}`,
})

// A bar with a count
const progress = logger.progress('Uploading', { total: files.length })
for (const [index, file] of files.entries()) {
  await upload(file)
  progress.update(index + 1, file.name)
}
progress.complete('Uploaded') // or progress.fail('Upload failed')
```

A progress bar never shows more than full, whatever is passed to `update()`.

### Structure

```ts
logger.table(
  [
    { service: 'Database', status: 'up' },
    { service: 'Cache', status: 'up' },
  ],
  { title: 'Services' },
)

logger.group('Database')
logger.log('Connecting...')
logger.success('Connected')
logger.groupEnd()
```

### Files and diffs

```ts
logger.file('src/config.ts', source) // with syntax highlighting, where the adapter has it
logger.diff('src/config.ts', unifiedDiff)
logger.fileError('src/app.ts', source, [14, 15], 10) // lines 14 and 15 marked; the excerpt starts at line 10
```

## Screens

A screen exists as soon as a logger or a prompt names it. To set it up yourself, or to change it later, inject it:

```ts
import { Screen } from '@navios/commander-tui'

private readonly screen = inject(Screen, { name: 'Deploy', icon: '🚀', static: false })
```

### Screen options

| Option | Meaning |
| --- | --- |
| `name` | Required. Two requests for the same name get the same screen. |
| `icon` | Shown in the sidebar. |
| `static` | `true` (default): the screen is a log without a status. `false`: it reports a [status](#status). |
| `hidden` | Start out of the sidebar. |
| `badgeCount` | A number next to the name. |
| `maxMessages` | How many messages are kept; older ones are dropped. Default `10000`; `0` keeps all. |

The options of the *first* request create the screen. Later requests for the same name get that screen as it is.

### Status

A screen with `static: false` is a task. It starts as `waiting`:

```ts
screen.setStatus('pending') // in progress
screen.setStatus('success') // or 'fail'
```

The sidebar marks each state and moves finished screens to the end. Without an interface, a task screen prints all its messages together when it finishes, under a header with its name, so that the output of two tasks that run at once is not interleaved. A static screen prints each message as it comes.

### Other methods

```ts
screen.hide() // and show()
screen.setBadgeCount(3)
screen.clear()
```

## The manager

`ScreenManager` knows all screens. The `tui()` plugin drives it for you; a program without the plugin, such as a script that uses the container directly, calls it itself:

```ts
import { ScreenLogger, ScreenManager } from '@navios/commander-tui'
import { Container } from '@navios/core'
import { inkAdapter } from '@navios/tui-adapter-ink'

const container = new Container()
const manager = await container.get(ScreenManager)
await manager.bind({ adapter: inkAdapter(), theme: 'dark' })

const logger = await container.get(ScreenLogger, { screen: 'Main' })
logger.log('Hello')

await manager.unbind() // gives the terminal back and prints what was shown
```

`bind()` and `unbind()` are safe to call twice, and to call while the other is still running.

## Memory

A screen keeps its messages so that the interface can scroll back, and so that it can print them when it closes. It keeps at most `maxMessages` of them. A program that logs for hours should also keep an eye on what it logs: a file or a diff is kept whole.
