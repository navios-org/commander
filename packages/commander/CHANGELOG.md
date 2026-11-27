# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-alpha.0] - 2026-11-27

A rewrite on `@navios/core` 2.0. See the migration guide in `apps/docs/content/docs/reference/migrating-to-2.md`.

### Breaking

- **The command line is a transport.** `CommanderFactory`, `defineCliEnvironment()`, `app.getAdapter()`, `CommanderAdapterService`, `CommandRegistryService` and `CliParserService` are removed. Start a program with `runCli(AppModule, options)`, or list `cliTransport()` in `createApplication()`.
- **`@CliModule` is removed.** `commands` is an option of `@Module` of `@navios/core`.
- **`@navios/core` is no longer re-exported**, and is a peer dependency. Import `inject`, `Injectable`, `Module` and the rest from it.
- **`@Command`**: `optionsSchema` is `options`. `token`, `priority` and `registry` are removed. `execute(options, ctx)` receives a `CommandContext` instead of the positionals, and the `CommandExecutionContext` token is removed.
- **`run()` takes the arguments without the executable and the script**, `process.argv.slice(2)` by default, returns the exit code and does not throw. The search for a known command word in `argv` is removed. `dispatch()` rejects with the error.
- **The parser is new** and decides types from the schema: `--name 123` stays a string for `z.string()`, `--offset -5` is a negative number, a boolean never takes the next argument, `--no-flag` sets `flag` to `false`, `--` ends the options. Unknown options and extra arguments are errors unless the schema (`z.looseObject`) or the path (`[...rest]`) asks for them.
- **Help is plain text on standard output**, no longer log lines. Usage errors print one line and exit with 2.
- **Enabling the terminal interface** moved to the `tui()` plugin of `@navios/commander-tui`: `enableTUI` and `tuiOptions` are removed, and the package no longer imports an adapter by name.
- Node.js 24 or later.

### Added

- `runCli()`: builds the application, runs the command, closes the application also when the command fails, sets the exit code, and aborts `ctx.signal` on Ctrl+C.
- Positional arguments declared in the path: `'copy <source> [target]'`, `'lint [...files]'`. They arrive in the options and are validated by the schema.
- Aliases for options (`.meta({ alias: 'n' })`) and for commands (`aliases: ['d']`), `-abc` groups, `-n5`, and `--key=value` for every form.
- Generated help for the program, for groups of commands (`mycli db`) and for commands, with arguments, choices, defaults and examples. `--version`.
- "Did you mean" suggestions for unknown commands and options. Validation issues name the option or argument.
- `CliError` and `CliUsageError`, and exit codes from the return value of `execute()`.
- Guards, interceptors and attributes on commands and their modules, shared with every other transport.
- `lazyCommand()`: a command whose code is imported when it runs.
- `CliOutput`, the injectable standard output and standard error of a program, and `ctx.output`.
- `@navios/commander/testing`: `createTestCli()` runs command lines in memory and returns stdout, stderr and the exit code.
- Any Standard Schema validates options; zod is an optional peer dependency.
- `execute()` is checked against the schema by the type of the decorator.
- `defaultCommand`, `hidden` commands and options, `examples`.

### Fixed

- `--__proto__.x=1` and the like wrote to `Object.prototype`. Such options are refused.
- `copy a.txt b.txt` was looked up as the command "copy a.txt b.txt". Arguments before the first option are arguments.
- A command that failed left the application open when the documented bootstrap was used.
- `-h` showed help for a command that uses `-h` for an option of its own.
- Options were parsed twice and every registered path was sorted on each run. A command's schema is now read once, the first time the command is used, and commands, guards and services are built only when needed.

## [1.9.0] - 2026-11-23

### Added

- **OpenTUI adapters on Node.js** - With `tuiOptions.adapter: 'react'` or `'solid'`, the factory now loads the adapter wherever OpenTUI can run, including Node.js 26.4+ started with `--experimental-ffi`. Before, it loaded them on Bun only. This needs `@navios/commander-tui` 1.7+; older versions keep the Bun-only behaviour.

### Changed

- **Dependencies** - Updated `@navios/core` to ^1.1.0 and the build/test toolchain (TypeScript 7.0, tsdown 0.23, Vitest 5, Yarn 4.19). No API changes.

## [1.8.0] - 2026-01-29

### Added

- **Smart Command Detection for Custom Launchers** - CLI parser now supports custom launchers (tsx, ts-node, npx, yarn workspace, etc.)
  - Automatically detects where the actual command starts in argv by matching against registered commands
  - Prioritizes longer/more specific commands (e.g., `db migrate production` matches before `db migrate` or `db`)
  - Falls back to default `slice(2)` behavior when no commands provided or no match found
  - New `availableCommands` parameter in `CliParserService.parse()` for smart detection
  - New `getAllPaths()` method in `CommandRegistryService` to retrieve all registered command paths

## [1.7.0] - 2026-01-29

### Added

- **Object Notation Support for CLI Parameters** - CLI parameters can now use object notation syntax
  - Supports nested object syntax like `--config.host=localhost --config.port=3000`
  - Automatically parses dot-separated keys into nested objects
  - Works seamlessly with existing zod schema validation

## [1.6.0] - 2026-01-27

### Added

- **Positional Arguments Support** - Commands can now receive positional arguments as a second parameter
  - `CommandHandler.execute()` now accepts optional `positionals?: string[]` parameter
  - Example: `copy --force source.txt dest.txt` passes `['source.txt', 'dest.txt']` as positionals
  - Fully backward compatible - existing commands without positionals parameter continue to work
- **Positionals via Execution Context** - Access positionals through dependency injection
  - New `getPositionals(): string[]` method on `CommanderExecutionContext`
  - Inject via `CommandExecutionContext` token for flexible access in services

## [1.5.0] - 2026-01-16

### Changed

- **Commander Factory** - Minor improvements to adapter loading

## [1.4.0] - 2026-01-15

### Added

- **Ink Adapter Support** - New `'ink'` adapter option for native terminal TUI rendering
  - Uses Ink/React for true terminal UI with cursor control
  - Automatically enables OpenTUI mode when Ink adapter is selected

### Changed

- **Adapter Default** - Default adapter changed from `'react'` to `'none'`
- **External Adapter Packages** - TUI adapters are now loaded from separate packages:
  - `@navios/tui-adapter-ink` - Ink/React terminal adapter
  - `@navios/tui-adapter-react` - OpenTUI React web adapter
  - `@navios/tui-adapter-solid` - OpenTUI Solid.js web adapter

## [1.3.0] - 2026-01-13

### Added

- **TUI Adapter Selection** - New `adapter` option in `CommanderTuiOptions` to choose the TUI framework
  - `'react'` (default) - Uses React-based TUI components
  - `'solid'` - Uses Solid.js-based TUI components
  - Dynamically imports the appropriate adapter module

## [1.2.0] - 2026-01-11

### Added

- **Legacy Compatibility Module** - New `@navios/commander/legacy-compat` subpath export for projects using TypeScript experimental decorators
  - `Command` decorator wrapper that converts legacy decorator API to Stage 3 format
  - `CliModule` decorator wrapper for legacy compatibility
  - Re-exports `@navios/core/legacy-compat` utilities for convenience

## [1.1.0] - 2026-01-10

### Added

- **TUI Mode Support** - New `enableTUI` option in `CommanderFactory.create()` to enable terminal UI mode
  - Dynamically imports `@navios/commander-tui` when enabled
  - Auto-binds `ScreenManager` with configurable options
  - Falls back to standard console logger when TUI is disabled
- **TUI Options** - New `CommanderTuiOptions` interface for TUI-specific configuration
  - `exitOnCtrlC`, `sidebarWidth`, `sidebarPosition`, `sidebarTitle`
  - `autoClose` with configurable delay
  - `theme` support (preset name or custom object)
  - `useMouse` and `hideDefaultScreen` options
- **Log Levels Configuration** - New `logLevels` option in `CommanderFactoryOptions`
- **Command Token Option** - New `token` option in `@Command()` decorator for custom injection tokens
- **Help Command Token** - New `HelpCommandToken` for overriding the built-in help command

### Changed

- **Optional TUI Dependency** - `@navios/commander-tui` is now an optional peer dependency
- **Command Decorator** - Internal token handling refactored to support custom tokens

### Dependencies

- Added optional peer dependency: `@navios/commander-tui` ^1.0.0

## [1.0.0] - 2026-01-09

### Added

- **Stable Release**: First stable release of @navios/commander
  - Production-ready CLI command framework for Navios
  - Type-safe command definitions with zod/v4 validation
  - Seamless integration with Navios dependency injection

## [1.0.0-alpha.4] - 2026-01-09

### Added

- **Unified Adapter Architecture**: Commander now uses the unified adapter system from `@navios/core`
  - `CommanderAdapterService` implements `AbstractCliAdapterInterface` with standard lifecycle methods
  - `AbstractCliAdapterInterface` extends `AbstractAdapterInterface` with CLI-specific methods (`run`, `executeCommand`, `getAllCommands`)
  - `CliEnvironment` interface for type-safe CLI configuration
  - `defineCommanderEnvironment()` function for creating CLI adapter environments
- **Command Description Support**: Commands now support `description` property for help text
  - `@Command({ path: 'greet', description: 'Greet a user' })`
  - Descriptions displayed in `--help` output
- **Built-in Help Command**: Automatic `help` command with `--help` flag support
  - Shows all available commands with descriptions
  - Per-command help with option details from zod/v4 schema metadata
  - Supports `.meta({ description: '...' })` on zod/v4 fields for option descriptions
- **Command Registry Service**: New `CommandRegistryService` for managing registered commands
  - Replaces module-level command tracking
  - Provides `register()`, `getByPath()`, `getAllAsArray()`, and `clear()` methods
- **Module Custom Entries**: Commands are now registered via `customEntries` in module metadata
  - `@CliModule({ commands: [...] })` stores commands in `customEntries` Map
  - Adapter discovers commands via `CommandEntryKey` in module metadata

### Changed

- **Factory Returns NaviosApplication**: `CommanderFactory.create()` now returns `NaviosApplication` instead of `CommanderApplication`
  - Use `app.getAdapter()` to access CLI-specific methods
  - Aligns with HTTP adapter pattern for consistency
- **CLI Module Decorator**: `@CliModule()` now extends `@Module()` with command registration
  - Commands are added to `customEntries` instead of separate metadata
  - Module imports and providers work the same as `@Module()`
- **Command Decorator**: Now stores metadata using standard Navios metadata system
  - Metadata includes `description` field for help text
- **Application Lifecycle**: Uses standard `NaviosApplication` lifecycle
  - `app.init()` initializes modules and adapter
  - `app.getAdapter().run()` executes CLI commands
  - `app.close()` disposes resources

### Removed

- **CommanderApplication Class**: Replaced by `NaviosApplication` with CLI adapter
- **CliModuleLoaderService**: Replaced by `CommanderAdapterService.onModulesInit()`
- **CliModuleMetadata**: Module metadata now uses standard `ModuleMetadata` with `customEntries`

### Breaking Changes

- **Factory Return Type**: `CommanderFactory.create()` returns `NaviosApplication` instead of `CommanderApplication`
  - Before: `const app = await CommanderFactory.create(AppModule); await app.run()`
  - After: `const app = await CommanderFactory.create(AppModule); await app.init(); await app.getAdapter().run()`
- **Method Access**: CLI methods accessed via `app.getAdapter()` instead of directly on app
  - Before: `app.executeCommand('greet', opts)`
  - After: `app.getAdapter().executeCommand('greet', opts)`
- **Module Decorator**: `@CliModule()` decorator signature unchanged but internal metadata format changed

### Dependencies

- Updated to support `@navios/core` ^1.0.0-alpha.4

## [1.0.0-alpha.2] - 2026-01-07

### Added

- **Module Overrides**: New `overrides` option in `@CliModule()` decorator for service override classes
  - Service override classes are imported for side effects to ensure their `@Injectable` decorators execute
  - Overrides should use the same `InjectionToken` as the original service with a higher priority
  - `CliModuleLoaderService` validates overrides and logs warnings if override is not active or not registered
  - Mirrors the same functionality as `@Module()` in `@navios/core`
- **Logger Integration**: `CliModuleLoaderService` now uses the `Logger` service for consistent logging

### Dependencies

- Updated to support `@navios/core` ^1.0.0-alpha.2

## [0.9.0] - 2025-12-23

### Dependencies

- Updated to support `@navios/di` ^0.9.0

## [0.8.0] - 2025-12-21

### Dependencies

- Updated to support `@navios/di` ^0.8.0

## [0.7.1] - 2025-12-20

### Fixed

- Fixed package.json exports to use correct CommonJS file extensions (`.cjs` and `.d.cts`)

## [0.7.0] - 2025-12-18

### Added

- **Comprehensive JSDoc Documentation**: Added detailed JSDoc comments to all public APIs including:
  - `CommanderFactory` class and `create` method
  - `CommanderApplication` class and all methods (`init`, `run`, `executeCommand`, `getAllCommands`, `getContainer`, `close`)
  - `Command` decorator function and `CommandOptions` interface
  - `CliModule` decorator function and `CliModuleOptions` interface
  - `CommandHandler` interface with generic type parameter
  - `CommanderExecutionContext` class and all methods (`getCommand`, `getCommandPath`, `getOptions`)
  - `CommandExecutionContext` injection token
  - `CommandMetadata` and `CliModuleMetadata` interfaces
  - Metadata utility functions (`getCommandMetadata`, `extractCommandMetadata`, `hasCommandMetadata`, `getCliModuleMetadata`, `extractCliModuleMetadata`, `hasCliModuleMetadata`)
  - `CliParserService` class and `ParsedCliArgs` interface
  - `CliModuleLoaderService` class and `CommandWithMetadata` interface

### Documentation

- Complete JSDoc comments for better IDE support and developer experience
- Enhanced type information and parameter descriptions
- Added usage examples in JSDoc comments for all public APIs
- Improved discoverability of API features through comprehensive documentation
- Updated README to accurately reflect the ExecutionContext API
