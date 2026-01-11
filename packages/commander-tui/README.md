# @navios/commander-tui

A powerful terminal user interface (TUI) library for building beautiful CLI applications with React. Built on top of [@opentui/react](https://github.com/nicepkg/opentui), it provides a high-level API for logging, prompts, progress indicators, and multi-screen management.

## Features

- **Rich Logging** - Multiple log levels (log, debug, warn, error, success, trace, fatal) with contextual labels
- **Interactive Prompts** - Confirm, choice, multi-choice, and text input prompts
- **Progress Indicators** - Loading spinners and progress bars with manual or promise-based resolution
- **Multi-Screen Support** - Manage multiple screens with a sidebar navigation
- **Tables & Groups** - Display tabular data and collapsible log groups
- **File Display** - Syntax-highlighted file content and diff views
- **Theming** - Built-in dark, light, and high-contrast themes
- **Dependency Injection** - Seamless integration with `@navios/core` container

## Installation

```bash
npm install @navios/commander-tui @navios/core
# or
yarn add @navios/commander-tui @navios/core
```

## Quick Start

```typescript
import { ScreenLogger, ScreenManager } from '@navios/commander-tui'
import { Container } from '@navios/core'

async function main() {
  const container = new Container()

  // Initialize the screen manager
  const screenManager = await container.get(ScreenManager)
  await screenManager.bind({ theme: 'dark' })

  // Get a logger instance
  const logger = await container.get(ScreenLogger, {
    screen: { name: 'Main' },
    context: 'App',
  })

  // Log messages
  logger.log('Application started')
  logger.debug('Debug information')
  logger.warn('Warning message')
  logger.error('Error occurred')
  logger.success('Operation completed!')

  // Cleanup when done
  screenManager.unbind()
}

main()
```

## API Reference

### ScreenManager

The main entry point for managing the TUI display.

```typescript
const screenManager = await container.get(ScreenManager)

// Bind to the terminal with options
await screenManager.bind({
  theme: 'dark', // 'dark' | 'light' | 'high-contrast'
})

// Get a screen by name
const screen = screenManager.getScreenByName('Build')
screen?.setStatus('success') // 'success' | 'error' | 'warning'

// Unbind when done
screenManager.unbind()
```

### ScreenLogger

A logger service that writes messages to a specific screen.

```typescript
const logger = await container.get(ScreenLogger, {
  screen: { name: 'Build', icon: '🔨' },
  context: 'Build', // Optional context label
})

// Log levels
logger.log('Info message')
logger.debug('Debug message')
logger.warn('Warning message')
logger.error('Error message')
logger.success('Success message')
logger.trace('Trace with stack')
logger.fatal('Fatal error')

// All methods are chainable
logger.log('Step 1').log('Step 2').success('Done!')
```

### IsomorphicLogger

A unified logger that automatically switches between `ScreenLogger` (TUI mode) and standard `Logger` (server mode) based on the environment. This is useful when writing code that needs to work both in TUI and non-TUI contexts.

```typescript
import { IsomorphicLogger } from '@navios/commander-tui'
import { inject, Injectable } from '@navios/core'

@Injectable()
class MyService {
  // Will use ScreenLogger when TUI is bound, otherwise standard Logger
  private logger = inject(IsomorphicLogger, { context: 'MyService' })

  doWork() {
    this.logger.log('Processing...')
    this.logger.debug('Debug info')
    this.logger.error('Something went wrong')
  }
}
```

The `IsomorphicLoggerFactory` checks if the `ScreenManager` has an active TUI binding:
- **TUI bound**: Returns a `ScreenLogger` instance with full TUI features
- **TUI not bound**: Returns a standard `Logger` instance for console output

This makes it easy to write services that can be used in both CLI tools with TUI and background server processes.

#### Loading Indicators

```typescript
// Manual loading control
const loading = logger.loading('Loading configuration...')
// ... do work ...
loading.success('Configuration loaded!')
// or
loading.fail('Failed to load configuration')

// Promise-based (sonner-style)
const result = await logger.promise(fetchData(), {
  loading: 'Fetching data...',
  success: 'Data fetched!',
  error: 'Failed to fetch data',
})

// With dynamic messages
await logger.promise(fetchData(), {
  loading: 'Fetching data...',
  success: (data) => `Fetched ${data.length} items`,
  error: (err) => `Error: ${err.message}`,
})
```

#### Progress Bars

```typescript
const progress = logger.progress('Processing files', { total: 100 })

for (let i = 0; i <= 100; i += 10) {
  progress.update(i, `Processing (${i}%)`)
  await delay(100)
}

progress.complete('All files processed!')
// or
progress.fail('Processing failed')
```

#### Tables

```typescript
logger.table(
  [
    { name: 'Alice', age: 30, role: 'Developer' },
    { name: 'Bob', age: 25, role: 'Designer' },
  ],
  { title: 'Team Members' }
)
```

#### Log Groups

```typescript
logger.group('Database Connection')
logger.log('Connecting...')
logger.debug('Host: localhost:5432')
logger.success('Connected!')
logger.groupEnd()
```

#### File Display

```typescript
// Display file content with syntax highlighting
logger.file('/src/app.ts', fileContent)

// Display diff
logger.diff('/src/app.ts', diffContent, 'unified') // or 'split'

// Display file with error lines highlighted
logger.fileError('/src/app.ts', fileContent, [5, 10, 15], 1)
```

### Prompt

Interactive prompts for user input.

```typescript
const prompt = await container.get(Prompt, {
  screen: 'Main',
})

// Confirm prompt
const confirmed = await prompt.confirm({
  question: 'Continue?',
  confirmText: 'Yes',
  cancelText: 'No',
  defaultValue: true,
})

// Single choice
const choice = await prompt.choice({
  question: 'Select a framework:',
  choices: [
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Other', value: 'other', input: true }, // Allows custom input
  ],
  defaultChoice: 'react',
})

// Text input
const name = await prompt.input({
  question: 'Project name?',
  placeholder: 'my-project',
  defaultValue: 'untitled',
})

// Multi-select
const features = await prompt.multiChoice({
  question: 'Select features:',
  choices: [
    { label: 'TypeScript', value: 'typescript' },
    { label: 'ESLint', value: 'eslint' },
    { label: 'Prettier', value: 'prettier' },
  ],
  defaultChoices: ['typescript'],
  minSelect: 1,
  maxSelect: 3,
})
```

All prompts support an optional `timeout` parameter for auto-resolution:

```typescript
const confirmed = await prompt.confirm({
  question: 'Continue?',
  timeout: 5000, // Auto-resolve with default after 5 seconds
})
```

## Multi-Screen Example

```typescript
const container = new Container()

const screenManager = await container.get(ScreenManager)
await screenManager.bind({ theme: 'dark' })

// Create loggers for different screens
const buildLogger = await container.get(ScreenLogger, {
  screen: { name: 'Build', icon: '🔨' },
})

const testLogger = await container.get(ScreenLogger, {
  screen: { name: 'Tests', icon: '🧪' },
})

// Each logger writes to its own screen
buildLogger.log('Building project...')
testLogger.log('Running tests...')

// Update screen status indicators
const buildScreen = screenManager.getScreenByName('Build')
buildScreen?.setStatus('success')
```

## Themes

Three built-in themes are available:

- `dark` - Dark background with light text (default)
- `light` - Light background with dark text
- `high-contrast` - High contrast for accessibility

```typescript
await screenManager.bind({ theme: 'high-contrast' })
```

## License

MIT
