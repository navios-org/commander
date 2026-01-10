/**
 * Commander TUI Examples
 *
 * This file demonstrates the usage of @navios/commander-tui
 * with the @navios/core dependency injection container.
 *
 * Run with: yarn start
 */

import { Prompt, ScreenLogger, ScreenManager } from '@navios/commander-tui'
import { Container } from '@navios/core'

// ============================================
// Example 1: Basic Logger Usage
// ============================================
async function basicLoggerExample() {
  const container = new Container()

  // Get the screen manager and bind it to display the TUI
  const screenManager = await container.get(ScreenManager)
  await screenManager.bind({
    theme: 'dark',
  })

  // Get a logger instance - it will automatically create a screen
  const logger = await container.get(ScreenLogger, {
    screen: { name: 'Main' },
    context: 'App',
  })

  // Basic log levels
  logger.log('Application started')
  logger.debug('Debug information')
  logger.warn('Warning message')
  logger.error('Error occurred')
  logger.success('Operation completed successfully')
  logger.trace('Trace information with stack')

  // Wait a bit then unbind
  await delay(5000)
  screenManager.unbind()
}

// ============================================
// Example 2: Progress and Loading
// ============================================
async function progressExample() {
  const container = new Container()

  const screenManager = await container.get(ScreenManager)
  await screenManager.bind({ theme: 'dark' })

  const logger = await container.get(ScreenLogger, {
    screen: { name: 'Progress Demo' },
  })

  // Loading with manual resolution
  logger.log('Starting loading demo...')
  const loadingHandle = logger.loading('Loading configuration...')

  await delay(2000)
  loadingHandle.success('Configuration loaded!')

  // Progress bar
  logger.log('Starting progress demo...')
  const progressHandle = logger.progress('Processing files', { total: 100 })

  for (let i = 0; i <= 100; i += 10) {
    progressHandle.update(i, `Processing files (${i}%)`)
    await delay(300)
  }
  progressHandle.complete('All files processed!')

  // Promise-based loading (sonner-style)
  logger.log('Starting promise demo...')
  await logger.promise(delay(2000), {
    loading: 'Fetching data from server...',
    success: 'Data fetched successfully!',
    error: 'Failed to fetch data',
  })

  await delay(2000)
  screenManager.unbind()
}

// ============================================
// Example 3: Prompt Usage
// ============================================
async function promptExample() {
  const container = new Container()

  const screenManager = await container.get(ScreenManager)
  await screenManager.bind({ theme: 'dark' })

  const logger = await container.get(ScreenLogger, {
    screen: { name: 'Prompts' },
  })

  const prompt = await container.get(Prompt, {
    screen: 'Prompts',
  })

  logger.log('Welcome to the prompt demo!')

  // Confirm prompt
  const confirmed = await prompt.confirm({
    question: 'Would you like to continue?',
    confirmText: 'Yes, continue',
    cancelText: 'No, cancel',
    defaultValue: true,
  })

  logger.log(`You selected: ${confirmed ? 'Continue' : 'Cancel'}`)

  if (confirmed) {
    // Choice prompt
    const framework = await prompt.choice({
      question: 'Which framework do you prefer?',
      choices: [
        { label: 'React', value: 'react' },
        { label: 'Vue', value: 'vue' },
        { label: 'Angular', value: 'angular' },
        { label: 'Other', value: 'other', input: true },
      ],
      defaultChoice: 'react',
    })

    logger.success(`You chose: ${framework}`)

    // Input prompt
    const projectName = await prompt.input({
      question: 'What is your project name?',
      placeholder: 'my-awesome-project',
      defaultValue: 'my-project',
    })

    logger.success(`Project name: ${projectName}`)

    // Multi-choice prompt
    const features = await prompt.multiChoice({
      question: 'Select features to include:',
      choices: [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'ESLint', value: 'eslint' },
        { label: 'Prettier', value: 'prettier' },
        { label: 'Testing', value: 'testing' },
      ],
      defaultChoices: ['typescript', 'eslint'],
      minSelect: 1,
    })

    logger.success(`Selected features: ${features.join(', ')}`)
  }

  logger.log('Demo completed!')
  await delay(3000)
  screenManager.unbind()
}

// ============================================
// Example 4: Multiple Screens
// ============================================
async function multiScreenExample() {
  const container = new Container()

  const screenManager = await container.get(ScreenManager)
  await screenManager.bind({ theme: 'dark' })

  // Create multiple loggers for different screens
  const buildLogger = await container.get(ScreenLogger, {
    screen: { name: 'Build', icon: '🔨' },
    context: 'Build',
  })

  const testLogger = await container.get(ScreenLogger, {
    screen: { name: 'Tests', icon: '🧪' },
    context: 'Test',
  })

  const lintLogger = await container.get(ScreenLogger, {
    screen: { name: 'Lint', icon: '📝' },
    context: 'Lint',
  })

  // Simulate parallel tasks
  buildLogger.log('Starting build process...')
  testLogger.log('Running test suite...')
  lintLogger.log('Checking code style...')

  // Build progress
  const buildProgress = buildLogger.progress('Compiling', { total: 50 })
  for (let i = 0; i <= 50; i += 5) {
    buildProgress.update(i, `Compiling (${i}/50 files)`)
    await delay(200)
  }
  buildProgress.complete('Build completed!')
  buildLogger.success('Build successful!')

  // Get the build screen and mark it as successful
  const buildScreen = screenManager.getScreenByName('Build')
  buildScreen?.setStatus('success')

  // Test progress
  const testProgress = testLogger.progress('Running tests', { total: 25 })
  for (let i = 0; i <= 25; i += 5) {
    testProgress.update(i, `Tests (${i}/25 passed)`)
    await delay(300)
  }
  testProgress.complete('All tests passed!')
  testLogger.success('Tests completed!')

  const testScreen = screenManager.getScreenByName('Tests')
  testScreen?.setStatus('success')

  // Lint progress
  const lintProgress = lintLogger.progress('Linting', { total: 30 })
  for (let i = 0; i <= 30; i += 5) {
    lintProgress.update(i, `Linting (${i}/30 files)`)
    await delay(150)
  }
  lintProgress.complete('Lint complete!')
  lintLogger.success('No lint errors!')

  const lintScreen = screenManager.getScreenByName('Lint')
  lintScreen?.setStatus('success')

  await delay(3000)
  screenManager.unbind()
}

// ============================================
// Example 5: Tables and Groups
// ============================================
async function tablesAndGroupsExample() {
  const container = new Container()

  const screenManager = await container.get(ScreenManager)
  await screenManager.bind({ theme: 'dark' })

  const logger = await container.get(ScreenLogger, {
    screen: { name: 'Data Display' },
  })

  // Table display
  logger.log('Displaying table data:')
  logger.table(
    [
      { name: 'Alice', age: 30, role: 'Developer' },
      { name: 'Bob', age: 25, role: 'Designer' },
      { name: 'Charlie', age: 35, role: 'Manager' },
    ],
    { title: 'Team Members' },
  )

  // Log groups
  logger.group('Database Connection')
  logger.log('Connecting to database...')
  logger.debug('Host: localhost:5432')
  logger.debug('Database: myapp')
  logger.success('Connected!')
  logger.groupEnd()

  logger.group('Cache Initialization')
  logger.log('Setting up cache...')
  logger.debug('Type: Redis')
  logger.debug('TTL: 3600s')
  logger.success('Cache ready!')
  logger.groupEnd()

  await delay(5000)
  screenManager.unbind()
}

// ============================================
// Utility
// ============================================
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================
// Main - Run selected example
// ============================================
async function main() {
  const example = process.argv[2] || 'basic'

  const examples: Record<string, () => Promise<void>> = {
    basic: basicLoggerExample,
    progress: progressExample,
    prompt: promptExample,
    multi: multiScreenExample,
    tables: tablesAndGroupsExample,
  }

  const selectedExample = examples[example]
  if (!selectedExample) {
    console.log('Available examples:')
    console.log('  yarn start basic    - Basic logger usage')
    console.log('  yarn start progress - Progress and loading')
    console.log('  yarn start prompt   - Interactive prompts')
    console.log('  yarn start multi    - Multiple screens')
    console.log('  yarn start tables   - Tables and groups')
    process.exit(1)
  }

  await selectedExample()
}

main().catch(console.error)
