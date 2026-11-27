# Commander 2.0: review of 1.x and what changed

Written on 2026-11-27, on the branch `feat/v2-groundwork`. It records what was found in the 1.x
code, what 2.0 does about each finding, and what is still open.

Each finding says how it is known:

- **run**: reproduced by running the 1.x code.
- **read**: established by reading the code; not run.
- **suspected**: a reviewer's suspicion that nobody confirmed.

## Summary

| Area | State of 1.x | In this branch |
| --- | --- | --- |
| `@navios/commander` | Built on core 1.x adapters. A parser that guessed types and had real bugs, one of them a prototype pollution. No exit codes, help printed through the logger. | Rewritten as a transport of core 2.0. New parser, help, errors, test helper. 60 tests. |
| `@navios/commander-tui` | Sound model (screens, loggers, prompts), but prompts could hang or auto-confirm, buffers were unbounded, and the Ink adapter depended on OpenTUI being available. | Migrated to core 2.0, new one-method adapter contract, `tui()` plugin, the bugs below fixed. 258 tests. |
| `@navios/tui-adapter-ink`, `-react` | About 85% the same code twice; rendering did O(n) work per log line. | New contract, shared store hooks moved to `commander-tui/react`, several rendering bugs fixed. The components themselves are still duplicated. |
| `@navios/tui-adapter-solid` | Outdated. | Removed. |
| Docs | A section of the Navios site, written for 1.x. | A site of its own in `apps/docs`, with a deploy workflow. |

## `@navios/commander` 1.9

### Bugs

| # | Finding | Known by | In 2.0 |
| --- | --- | --- | --- |
| 1 | `--__proto__.polluted=1` writes to `Object.prototype`. Any command without a strict schema is affected; the next thing to break is unrelated code that iterates objects. | run | Refused, with a test. |
| 2 | `copy a.txt b.txt` is looked up as the command `"copy a.txt b.txt"` and fails with "Command not found". Positionals only work after an option. | run | Longest registered path wins; the rest are arguments. |
| 3 | `--name 123` yields the number `123`, so `z.string()` rejects it. Same for `true`, `null`, `undefined` and JSON-looking strings. | run | The schema decides the type. |
| 4 | `--offset -5` yields `{ offset: true, 5: true }`. | run | Negative numbers are values. |
| 5 | `--force a.txt b.txt` without a schema that marks `force` boolean yields `force: 'a.txt'`. | run | A boolean never takes the next argument. |
| 6 | `--` yields an option named `''`; what follows is still parsed as options. | run | Ends the options. |
| 7 | `--no-color` yields `noColor: true`. | run | Sets `color` to `false`. |
| 8 | `-h` always means help, so a command cannot use it for `--host`. | run | The command's own alias wins. |
| 9 | Smart command detection scans `argv` from index 1 for any registered command word. `node copy greet --name x`, a script named like a command, is read as the command `copy greet`. | run | Removed. `run()` takes `argv.slice(2)`. |
| 10 | Unknown options are dropped silently by `z.object()`, so a typo changes behaviour without a word. | read | Error with a suggestion, unless the schema is loose. |
| 11 | On a failing command `run()` logs, prints the command list for "not found", and rethrows. The documented bootstrap has no `try`, so `app.close()` is skipped and services are not shut down. No exit code is set. | read | `runCli()` always closes and sets the code. |
| 12 | A `ZodError` is logged as its JSON message. | read | One line per issue, named by option. |
| 13 | Help is written with `Logger`, so every line carries a level and a context, and it disappears when the log level excludes `log`. | read | Plain text on standard output. |
| 14 | `executeCommand` begins a request scope for every run and resolves the command through it, with an id made of `Date.now()` and `Math.random()`. | read | A scope is created only when something request-scoped is used. |

### Costs

- `argv` is parsed twice per run, and every registered path is copied and sorted on each parse
  (read). 2.0 looks the command up in a map by at most `maxWords` joins.
- `index.mts` re-exports all of `@navios/core`, which makes two import paths for every symbol and
  hides which package a thing belongs to (read). Removed.
- `new Function('return import(p)')` is used to load the TUI packages. It defeats bundlers on
  purpose and fails under a CSP without `unsafe-eval` (read). Removed: adapters are passed in.
- Commands are imported eagerly through the module tree; there is no way to defer one (read). 2.0
  defers construction, schema introspection and guard resolution to first use, and adds
  `lazyCommand()` for deferring the import as well.

### What was missing

Exit codes, `--version`, aliases, declared positionals, group help for subcommands, typo
suggestions, guards and interceptors on commands, a way to test a command without spawning a
process, an abort signal for Ctrl+C. All are in 2.0.

## `@navios/commander-tui` 1.7

All findings here are **read** unless marked.

### Bugs fixed

| Finding | In 2.0 |
| --- | --- |
| `bind()` gated every adapter on OpenTUI support, so the Ink adapter was not used on Node.js before 26.4 unless `useOpenTUI: true` was passed. | The adapter says whether it can run. |
| A bare `catch {}` around the adapter start reported every error as "adapter not available". A renderer that was created before the failure was dropped without `destroy()`, leaving the terminal in the alternate screen. | The reason is printed; the OpenTUI adapter destroys its renderer on failure. |
| No re-entrancy guard: two `bind()` calls made two renderers; `q` plus auto-close unmounted twice. | `bind()` and `unbind()` are serialised and idempotent. |
| `unbind()` and `removeScreen()` never resolved open prompts, so `await prompt.confirm()` hung forever. | Resolved with their defaults. |
| A prompt's timeout ran from when it was queued, so it could expire while the person answered the previous one. | Starts when shown. |
| Without a terminal, `confirm()` resolved to its default, and the default was yes. | The default is no. |
| `defaultChoice` that is not a choice was returned as the answer. | Throws. |
| `messages` of a screen grew without bound, also in stdout mode where each message had already been printed. | `maxMessages`, 10 000 by default. |
| A static screen that got a status printed its whole buffer a second time; a finished task screen never printed later messages. | Fixed, with a test. |
| `autoClose` was not armed by `bind()` for screens that were already done; its timer kept the process alive; a failing `unbind()` in it was an unhandled rejection. | Fixed. |
| A prompt on a hidden screen made the hidden screen active. | The screen is shown. |
| `file()`, `diff()` and `fileError()` were gated as `debug`; `loading`, `progress`, `group`, `table` and `promise` were not gated at all; `trace()` captured a stack before checking the level. | All follow the levels. |
| ANSI colours were written to pipes and files; `NO_COLOR` was ignored. | Colours on terminals only; `NO_COLOR` and `FORCE_COLOR` honoured. |
| Digits toggled log levels while the filter's search field had the focus; the hint and the bindings named seven levels where there are six. | Digits toggle only when the levels have the focus. |
| `groupEnd` printed `end ` with an empty label. | Fixed. |
| `zod` was imported but not declared; `react` and `@opentui/core` types were imported by the core types. | `zod` is a dependency; the core types are renderer-free. |

### Still open

| Finding | Why it is open |
| --- | --- |
| No `process.on('exit' / 'uncaughtException')` safety net: a crash while the interface is up loses the buffered messages, and restoring the terminal is left to the adapter. | Needs a synchronous restore path in each adapter. Ink has one for `exit`; OpenTUI does not. |
| A force-flushed screen that never finished is printed under the header `[COMPLETED]`. | Cosmetic; needs a third header. |
| `removeBinding('escape')` removes every escape binding; `disableKey('k')` also disables `up`; a handler that returns `undefined` counts as consumed, against its doc. | Keyboard manager API needs a small redesign; nothing in the packages calls these. |
| `ScreenInstance` exposes about 25 methods that only adapters call (`_addPrompt`, `prompt*`, `addMessage`). | Splitting it into a public screen and an adapter-facing store is the next refactor. |
| `FilterEngine` lower-cases the query per message and whole file bodies per keystroke. | Performance only matters with large files; fix with the virtualisation work below. |
| Naming is uneven: `fail` / `failed` / `error`, `defaultChoice` / `defaultValue` / `defaultChoices`. | Worth one renaming pass before 2.0 is stable. |
| `'?'` may not fire on terminals that report `shift: true` (suspected). | Not confirmed. |

## Adapters

### Fixed

| Finding | Known by |
| --- | --- |
| After switching screens, a screen that had logged in the background showed stale messages until its next log. | read |
| The sidebar listened for `visibility:changed` on the manager, which only screens emit, and for nothing on status or badge. Show, hide, status and badge changes did not repaint. | read |
| A progress value beyond the total made `'░'.repeat(-n)` throw and took the tree down. | read |
| One `message:updated` listener per loading or progress row, with the default limit of ten: the eleventh row printed a `MaxListenersExceededWarning` over the interface. | read |
| Every log line re-rendered synchronously. A burst of 1000 lines rendered 1000 times. | read |
| `useMessageUpdate` copied and scanned the whole message list per row per update. | read |
| Ink: `exitOnCtrlC` was hard-coded; after Ctrl+C the manager was never told, so the command ran on behind a blank screen. | read |
| OpenTUI: `selectedBackground + '80'` made an invalid ten-digit colour with the dark theme. | run (printed by its own tests) |
| Neither adapter read the sidebar position. | read |
| `react` was a dependency of the OpenTUI adapter, risking two copies; `web-tree-sitter` was pinned and unused. | read |

### Still open

These are real and worth doing before 2.0 is stable. None is a quick patch.

1. **The components are duplicated.** About 1300 lines differ only in JSX primitives
   (`<Box>` and `<box>`): bridges, prompt renderer, sidebar, help overlay, filter bar, table,
   progress, groups, log message. The store hooks are shared now; the view logic (grouping,
   sidebar partition, table column widths, prompt view-models) should move next, leaving each
   adapter with primitives and mounting.
2. **No windowing in Ink.** All messages are laid out and clipped with a negative margin, and
   every item is measured on every render. With `maxMessages` this is bounded at 10 000 rows
   instead of unbounded, which is still far too many to lay out. Render the visible window only.
3. **No `React.memo` on message rows**, and `BorderedLine` is defined inside `LogMessage`'s
   render, which remounts its subtree on every render.
4. **Ink scroll heights are never pruned** after `clear()` or a narrowing filter, so the scroll
   range can be too large (keys are item indices).
5. **Ink re-attaches its mouse listener on every `ScrollBox` render** because `onScroll` is an
   inline function.
6. **Ink signal listeners write the exit sequence and do nothing else.** Under `runCli()` this no
   longer matters, since it closes the application on a signal; a program that binds the manager
   itself still has to.
7. **Nested groups flatten**, and a search that matches a group start swallows what follows,
   because group ends have no label and are filtered out.
8. **The prompt countdown is computed at render and never ticks.**
9. **No keyboard scrolling** in either adapter; mouse only.
10. **The sidebar draws pending screens first but selects in manager order**, so Down can move
    the highlight up.
11. Suspected, not confirmed: Ink does not re-measure on resize until the next message; mouse
    click sequences may leak into `useInput`; `SyntaxStyle.create()` is never destroyed.

## Decisions worth a second look

- **zod stays the only schema library that is introspected.** Other Standard Schemas validate but
  give no option types, aliases or help. Supporting more means one reader per library.
- **Unknown options are errors by default**, even though `z.object()` itself strips them. This is
  the stricter choice and the one that catches typos; `z.looseObject()` opts out.
- **`run()` takes `argv.slice(2)`.** Launchers that add arguments in front must pass `args`
  themselves. The 1.x heuristic was wrong too often to keep.
- **`confirm()` defaults to no.** It changes the result of unattended runs that relied on yes.
- **The interface closes when the command ends** under `runCli()`. `autoClose` therefore only
  matters for programs that stay up. If commands should linger for a moment so the last frame can
  be read, that is an option to add to `tui()`.
- **`CliOutput` is separate from `Logger`.** Results go to standard output, diagnostics to the log.

## Verification

Run on Node.js 24.22.1 and Bun 1.4.5:

- `yarn build`: lint, typecheck, tests and build of the four packages.
- `examples/commander-tui` run piped, for help, a command, a usage error and a refused prompt.
- The same example under a pseudo-terminal: the Ink interface entered the alternate screen, drew,
  restored the terminal, printed the transcript and exited.
- `yarn docs:build`, with dead-link checking on.

Not verified:

- The OpenTUI adapter drawing in a real terminal. Its tests pass under Bun, but it was not run
  interactively.
- Anything on Node.js 26.
- Windows.

## Dependency note

The workspace uses `@navios/core` **2.0.0-alpha.1**. It was published on the day of this work, and
Yarn's release-age gate holds back versions younger than a day, so `.yarnrc.yml` now exempts the
first-party scope with `npmPreapprovedPackages: ["@navios/*"]`.

`runCli()` calls `ConsoleLogger.setDefaults()` to drop the pid and the timestamp from log lines.
The method exists in alpha.1 but is missing from its published types, so the call goes through a
cast and is skipped where the method is absent. Exporting it in core would remove the cast.
