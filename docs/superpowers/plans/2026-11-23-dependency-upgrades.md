# Dependency Upgrades (Nov 2026) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every dependency in the monorepo to the latest release as of 2026-11-23, except the ones listed below as blocked, with all quality gates green after each step.

**Architecture:** Each task upgrades one group of dependencies that must move together. Tasks run from lowest to highest risk, and each ends with the shared Gate and its own commit on `chore/deps-2026-11`. Tooling comes first (package manager, lint, build, tests, compiler), then runtime libraries (Ink/React, OpenTUI), then changelogs and version bumps. Nothing is published or tagged.

**Tech Stack:** Yarn 4 workspaces, Turbo, tsdown/rolldown + SWC, Vitest + Bun test, TypeScript, Ink, OpenTUI.

**Spec:** There is no separate spec document. The source is the user's request of 2026-11-23 ("plan the updates to the corresponding latest versions"), plus registry data and upstream changelogs checked the same day. The facts that matter are copied into the sections below.

## Version matrix

| Package | Where declared | Now | Target | Task |
|---|---|---|---|---|
| yarn (`packageManager`) | root | 4.12.0 | 4.19.0 | 1 |
| turbo | root | ^2.7.4 | ^2.11.13 | 1 |
| @swc/core | root | ^1.15.8 | ^1.16.22 | 2 |
| tslib | root | ^2.8.1 | ^2.9.1 | 2 |
| tsx | commander, examples/tui | ^4.21.0 | ^4.23.15 | 2 |
| zod | root, commander (dev), examples/commander-tui | ^4.3.5 | ^4.6.7 | 2 |
| @navios/core | commander, commander-tui (dev), examples | ^1.0.0 | ^1.1.0 | 2 |
| strip-ansi | tui-adapter-ink | ^7.1.0 | ^7.2.0 | 2 |
| @testing-library/react | tui-adapter-ink, tui-adapter-react | ^16.3.1 | ^16.3.3 | 2 |
| solid-js | tui-adapter-solid | ^1.9.10 | ^1.9.20 (stays on 1.x) | 2 |
| @babel/plugin-proposal-decorators | tui-adapter-solid | ^7.28.6 | ^7.29.7 (stays on 7.x) | 2 |
| @types/node | root | 25.0.9 (exact) | ^24 (D3) | 2 |
| @types/bun | root, tui-adapter-react, tui-adapter-solid | ^1.3.6 | ^1.4.5 | 2 |
| oxlint | root | ^1.39.0 | ^1.94.0 | 3 |
| oxfmt | root | ^0.24.0 | ^0.79.0 | 3 |
| tsdown | root | ^0.19.0 | ^0.23.7 | 4 |
| unplugin-swc | root, tui-adapter-ink | ^1.5.9 | ^2.0.0 | 4 |
| vitest | root, tui-adapter-ink | ^4.0.17 | ^5.1.1 | 5 |
| @vitest/coverage-v8 | root | ^4.0.17 | ^5.1.1 | 5 |
| vite (**new**, now a required peer of vitest 5) | root | 7.3.1 (transitive) | ^7.3.1 | 5 |
| happy-dom | tui-adapter-ink | ^20.3.1 | ^21.0.4 | 5 |
| @happy-dom/global-registrator | tui-adapter-react | ^20.3.1 | ^21.0.4 | 5 |
| typescript | root + every package | ^5.9.3 | ^7.0.2 (D1) | 6 |
| @typescript/native-preview | root | ^7.0.0-dev.20260115.1 | **removed** (replaced by typescript 7) | 6 |
| ink | tui-adapter-ink | ^6.6.0 | ^8.0.0 | 7 |
| react, react-dom | tui-adapter-ink, tui-adapter-react | ^19.2.3 | ^19.3.1 | 7 |
| @types/react, @types/react-dom | tui-adapter-ink, tui-adapter-react | ^19.2.x | ^19.3.0 | 7 |
| @opentui/core, /react, /solid | tui-adapter-react, tui-adapter-solid; commander-tui (new) | ^0.1.73 | ^0.9.7 | 8 |
| web-tree-sitter (**new**) | tui-adapter-react, tui-adapter-solid | — | 0.25.10 | 8 |

**Held back (blocked upstream):**
- **solid-js 2.0.3.** No `@opentui/solid` release supports Solid 2; 0.9.7 still has the peer `solid-js ^1.9.12`.
- **@solidjs/testing-library 1.0.0-rc.** It requires solid-js 2.
- **@babel/plugin-proposal-decorators 8.0.2.** It requires `@babel/core ^8`, while `rolldown-plugin-solid` and `@opentui/solid` run Babel 7.

**Already at their latest version:** @navios/builder 1.0.0, ink-testing-library 4.0.0, ink-syntax-highlight 2.0.2, rolldown-plugin-solid 0.2.1.

## Decisions (defaults below; the user confirms before execution)

- **D1. TypeScript target: 7.0.2.**
  - 7.0 is the native Go compiler. It has one binary, `tsc`, and **no JS API**.
  - tsdown's declaration step therefore goes through rolldown-plugin-dts's tsgo CLI fallback. That fallback is deprecated "for the next minor", but tsdown 0.23.7 pins `rolldown-plugin-dts ^0.30`, so it holds until tsdown moves.
  - Fallback if Task 6 fails its declaration check: `typescript ~6.0.3` (the last JS-API release), keep `@typescript/native-preview` and `tsgo` for `check`, and revisit when TS 7.1 (now in beta, ships a new API) is stable.
- **D2. The three TUI adapters become ESM-only.**
  - Their CJS builds already fail to load. This was checked on 2026-11-23:
    - `tui-adapter-ink/lib/index.cjs` on Node 24 fails with `ERR_REQUIRE_ASYNC_MODULE`, because ink and yoga-layout use top-level await.
    - `tui-adapter-react` and `tui-adapter-solid` `lib/index.cjs` on Bun fail with `require() async module ... unsupported`.
  - Change: drop `'cjs'` from those three tsdown `format` arrays; drop `main`, the `require` condition and the `.cjs`/`.d.cts` paths from their `package.json`.
  - `commander` and `commander-tui` keep dual ESM+CJS output; both load fine either way today.
- **D3. `@types/node` goes to `^24`, not 26.**
  - Node 26 has been Active LTS since 2026-10-28, but the local runtime is Node 24.22.1.
  - The toolchain floors are Node 22 and 24 (vitest 5, tsdown 0.23, ink 8).
  - Typing against 24 keeps APIs that exist only in Node 26 out of library code.

## Global Constraints

- Branch `chore/deps-2026-11` from `main`. The uncommitted change in `packages/commander-tui/src/keyboard/index.ts` belongs to the user, who commits or stashes it first. The executor never touches it.
- Set ranges explicitly, either by editing `package.json` or with `yarn up <name>@<range>`. **Never** run `yarn up '*'` or a blanket `--latest`: that would pull in solid-js 2 and Babel 8.
- Each of these groups moves to one version, in every `package.json` that lists them:
  - `vitest` and `@vitest/coverage-v8` (coverage-v8 5.1.1 peers `vitest` exactly 5.1.1)
  - `react` and `react-dom` (react-dom 19.3.1 requires react ^19.3.1)
  - `@types/react` and `@types/react-dom`
  - `happy-dom` and `@happy-dom/global-registrator`
  - `@opentui/core`, `@opentui/react` and `@opentui/solid` (react and solid 0.9.7 pin core to exactly 0.9.7)
  - `@types/node` and `@types/bun`: upgrade them together. bun-types 1.4 together with @types/node 25.0.0–25.0.9 breaks `process.on` typing (oven-sh/bun#39807).
- A dependency listed in several `package.json` files gets the same range in all of them.
- No `publish:*`, no git tags, no push.

**Gate** (the last step of every task; a task is done only when every item holds):
1. `yarn install` exits 0. Any peer-dependency warning (YN0060) for a package this task touched is fixed, or quoted in the commit body.
2. `yarn build --force` passes `check`, `test:ci`, `lint` and `build` for all 5 packages.
   - Passing tests are at least the baseline, with 0 failures:
     - vitest: commander 107, commander-tui 243, tui-adapter-ink 152
     - bun test: tui-adapter-react 179, tui-adapter-solid 56
   - vitest prints `Type Errors  no errors`.
3. `git status --short` lists only files this task means to change.
   - Turbo's `lint` step runs `oxlint --fix && oxfmt`. Outside Task 3, any file it rewrites is a finding to explain, not something to commit silently.
4. The smoke load (below) matches the expected table for that point in the plan.

**Smoke load** (run from the repo root):

```bash
for p in commander commander-tui tui-adapter-ink tui-adapter-react tui-adapter-solid; do
  d=packages/$p/lib
  esm=$(node --input-type=module -e "import('./$d/index.mjs').then(()=>console.log('ok')).catch(e=>console.log('FAIL '+(e.code||e.message)))" 2>&1 | tail -1)
  cjs=$( [ -f $d/index.cjs ] && node -e "try{require('./$d/index.cjs');console.log('ok')}catch(e){console.log('FAIL '+(e.code||e.message))}" 2>&1 | tail -1 || echo n/a)
  bun=$(bun -e "await import('./$d/index.mjs'); console.log('ok')" 2>&1 | tail -1)
  printf "%-18s node-esm=%-28s node-cjs=%-28s bun-esm=%s\n" "$p" "$esm" "$cjs" "$bun"
done
```

Baseline (2026-11-23): commander and commander-tui load everywhere. tui-adapter-ink loads as node-esm ok, node-cjs FAIL `ERR_REQUIRE_ASYNC_MODULE`. tui-adapter-react and tui-adapter-solid give node FAIL `ERR_UNKNOWN_FILE_EXTENSION` (they are Bun-only at OpenTUI 0.1.73) and bun-esm ok.

## Review Focus

1. **People loading the built packages.** Every test runs from `src/`, so nothing loads `lib/`. A packaging regression would only show up for consumers. → The smoke load is part of every Gate; Tasks 4, 6, 7 and 8 state their expected table.
2. **The published `.d.mts`/`.d.cts` after tsdown 0.23 and the TS 7 declaration path.** Nothing type-checks the emitted declarations, and a silently dropped export breaks downstream users. → Tasks 4 and 6 diff every `lib/*.d.mts` against the Task 0 snapshot. Any exported name that disappears fails the task.
3. **Escape and Backspace in the Ink adapter.**
   - Ink 7 stopped setting `key.meta` on a plain Escape, and maps the physical Backspace key to `key.backspace`.
   - `keyboard_manager.ts:131` requires `meta` to match exactly. So under Ink 6 the `escape` binding (`create_bindings.ts:33`) probably never fired. This is inferred, not observed.
   - → Task 7 writes an integration test first, under Ink 6, and records whether it fails.
4. **Terminal state after leaving the OpenTUI screen.**
   - Since 0.6.0, `destroy()` restores the terminal asynchronously.
   - `screen_manager.ts:311` destroys the renderer, and `:322` writes screens to stdout right after.
   - → Task 8 awaits `renderer.closed` and adds a unit test for the ordering. The real-terminal check is manual (Task 8, last step).
5. **Syntax highlighting in `<code>`/`<diff>`.**
   - It needs the `web-tree-sitter` wasm at runtime. Today's `bun test` in tui-adapter-react already logs `Cannot find package 'web-tree-sitter'`.
   - → Task 8 adds it as a dependency, and the test output must no longer contain that line.

---

### Task 0: Branch, baseline, declaration snapshot

**Files:** none committed (`tmp/` is git-ignored).

- [ ] **Step 1:** `git status --short` → shows at most `?? CLAUDE.md`. If `packages/commander-tui/src/keyboard/index.ts` is still modified, stop and ask the user.
- [ ] **Step 2:** `git switch -c chore/deps-2026-11`
- [ ] **Step 3:** `yarn build --force` → green, with the baseline counts from the Gate.
- [ ] **Step 4:** Snapshot the build output: `rm -rf tmp/deps-baseline && mkdir -p tmp/deps-baseline && for p in packages/*; do cp -R $p/lib tmp/deps-baseline/$(basename $p); done`
- [ ] **Step 5:** Run the smoke load. Output equals the Baseline table above.

### Task 1: Yarn 4.19 and Turbo 2.11

**Files:** `package.json` (`packageManager`, `turbo`), `.yarnrc.yml`, `.yarn/releases/`, `yarn.lock`

- [ ] **Step 1:** `yarn set version 4.19.0` → `packageManager` becomes `yarn@4.19.0`, a new `.yarn/releases/yarn-4.19.0.cjs` appears, and `yarnPath` is updated.
- [ ] **Step 2:** Delete `.yarn/releases/yarn-4.12.0.cjs`.
- [ ] **Step 3:** Set `"turbo": "^2.11.13"`, then run `yarn install`.
  - Yarn ≥4.14 migrates the v8 lockfile, and writes `enableScripts: true`, `npmMinimalAgeGate: 0` and `approvedGitRepositories: ['**']` into `.yarnrc.yml` to keep today's behaviour.
  - Keep exactly what it writes, and mention it in the commit body.
- [ ] **Step 4:** Gate.
- [ ] **Step 5:** Commit `chore(deps): yarn 4.19.0, turbo 2.11`.

### Task 2: Low-risk bumps

**Files:** `package.json`; `packages/{commander,commander-tui,tui-adapter-ink,tui-adapter-react,tui-adapter-solid}/package.json`; `examples/{commander-tui,tui}/package.json`; `yarn.lock`

- [ ] **Step 1:** Set every range marked Task 2 in the version matrix.
  - Leave the `commander` peer `zod: ^4.0.0` and all `@navios/core: *` peers unchanged.
  - `zod/v4` is still exported in 4.6.7, so no import changes are needed.
- [ ] **Step 2:** Gate.
  - If `check` reports `process.on`/`process.off` overload errors, @types/node and @types/bun are out of step. Confirm both moved.
- [ ] **Step 3:** Commit `chore(deps): patch/minor bumps (swc, zod, navios core, types, solid 1.9.20, babel 7.29)`.

### Task 3: oxlint 1.94 and oxfmt 0.79

**Files:** `package.json`, `.oxfmtrc.json:5,8`, possibly `.oxlintrc.json`, then every file oxfmt rewrites.

- [ ] **Step 1:** Bump both. In `.oxfmtrc.json`:
  - rename `experimentalSortImports` to `sortImports`
  - rename `experimentalSortPackageJson` to `sortPackageJson`
  - The old names still work as aliases but are gone from the schema.
- [ ] **Step 2:** `yarn install`, then commit the config only: `chore(deps): oxlint 1.94, oxfmt 0.79`.
- [ ] **Step 3:** `yarn lint`.
  - Expect oxfmt to rewrite TS files, and now also Markdown (READMEs, CHANGELOGs) and `bunfig.toml`, which it formats natively since 0.72/0.73.
  - Commit only the mechanical rewrite: `style: reformat with oxfmt 0.79`.
- [ ] **Step 4:** Run `yarn run -T oxlint` from the root and handle every new diagnostic.
  - Newly default (`correctness`) rules: `prefer-namespace-keyword`, `no-iterator`, `no-misleading-character-class`, `no-useless-default-assignment`, `getter-return`, `no-unreachable`.
  - Stricter rules: `no-unused-vars` now reports a bare `_` parameter; `no-irregular-whitespace` now checks comments.
  - Fix the code, or turn the rule off in `.oxlintrc.json` with a one-line reason.
  - Since 1.93, `oxlint --fix` deletes `oxlint-disable` comments it considers unused; review those removals.
- [ ] **Step 5:** Gate.
- [ ] **Step 6:** Commit `fix(lint): address oxlint 1.94 findings`.

### Task 4: tsdown 0.23.7 and unplugin-swc 2.0.0

**Files:** `package.json`, `packages/tui-adapter-ink/package.json`, `packages/{commander-tui,tui-adapter-ink,tui-adapter-react,tui-adapter-solid}/tsdown.config.mts`

- [ ] **Step 1:** Bump both. `swc.rolldown`/`swc.vite` and `rolldown/filter`'s `withFilter` keep their names.
- [ ] **Step 2:** Move the deprecated bundling options (deprecated in 0.21, they print warnings in 0.23) into `deps`:
  - In the four configs: `external: [...]` → `deps: { neverBundle: [...] }`.
  - In the solid config: `noExternal: [...]` → `deps.alwaysBundle`.
  - Delete the stray `console.log('zod')` at `packages/commander-tui/tsdown.config.mts:4`.
- [ ] **Step 3:** `yarn build --force` → the output contains no tsdown deprecation warnings.
- [ ] **Step 4:** File-set check. For each package:

  ```bash
  diff <(cd tmp/deps-baseline/$p && find . -type f | sort) <(cd packages/$p/lib && find . -type f | sort)
  ```

  The output is empty: still `.mjs`/`.cjs`/`.d.mts`/`.d.cts`, because `fixedExtension` defaults to true when `platform` is `node`.
- [ ] **Step 5:** Declaration check. Run `diff -u tmp/deps-baseline/$p/index.d.mts packages/$p/lib/index.d.mts`, plus `legacy-compat/` for commander. No exported name disappears; formatting and reordering are fine.
- [ ] **Step 6:** Gate. The smoke output still equals the Baseline table.
- [ ] **Step 7:** Commit `chore(deps): tsdown 0.23, unplugin-swc 2`.

### Task 5: Vitest 5 and happy-dom 21

**Files:** `package.json` (vitest, @vitest/coverage-v8, add `vite`), `packages/tui-adapter-ink/package.json` (vitest, happy-dom), `packages/tui-adapter-react/package.json` (@happy-dom/global-registrator)

- [ ] **Step 1:** Bump the Task 5 rows and add `"vite": "^7.3.1"` to the root devDependencies.
  - Vitest 5 no longer depends on vite, so Yarn won't install it as a peer by default.
  - Stay on Vite 7: whether unplugin-swc works with the rolldown-based Vite 8 is unverified.
- [ ] **Step 2:** `yarn build --force`.
  - Vitest 5 switched its value formatter from loupe to pretty-format, so `tui-adapter-ink/src/__tests__/integration/__snapshots__` may fail.
  - Accept with `yarn run -T vitest run -u` (inside `packages/tui-adapter-ink`) only if the diff is serializer formatting, never different rendered frame text.
- [ ] **Step 3:** No other code changes are expected:
  - All 9 `vi.mock` calls are at the top level.
  - Every `.rejects`/`.resolves` is awaited.
  - The new `clearMocks: true` default only makes the explicit `vi.clearAllMocks()` calls redundant.
- [ ] **Step 4:** Gate.
- [ ] **Step 5:** Commit `chore(deps): vitest 5.1, happy-dom 21`.

### Task 6: TypeScript 7.0.2 (D1)

**Files:**
- `package.json`: `typescript` set to `^7.0.2`; remove `@typescript/native-preview`.
- The `typescript` devDependency in `packages/*/package.json` and `examples/commander-tui/package.json`: set to `^7.0.2`.
- Scripts: `tsgo` → `tsc` in every package's `check` script and in `examples/commander-tui`'s `compile` script.
- `tsconfig.base.json`: add `"types": ["node"]`. TS 7 now defaults `types` to `[]`.
- `packages/{tui-adapter-react,tui-adapter-solid}/bun-plugin.mts`: delete `transpileFileWithTypescript` and the `'typescript'` branch of `MODE`. That path is unused (`MODE` is the constant `'esbuild'`), and TS 7 has no `transpileModule`.

- [ ] **Step 1:** Apply the edits above, then `yarn install`.
- [ ] **Step 2:** `yarn check`. It must pass.
  - If errors like `Cannot find name 'process'`/`'Buffer'` or `Cannot find module 'bun:test'` show up, add `"node"` and/or `"bun"` to `types` in the failing package's tsconfig only.
  - `packages/commander/tsconfig.spec.json` already sets `"types": []`. Change it only if the check fails there.
- [ ] **Step 3:** `cd packages/commander && yarn run -T vitest run` → prints `Type Errors  no errors`. Vitest's typecheck runs `tsc`, which is now the native binary.
- [ ] **Step 4:** `yarn build --force`, then repeat Task 4 Steps 4–5 (file set and declaration diff against `tmp/deps-baseline`).
  - **If declaration generation errors, or an export disappears, apply the D1 fallback:**
    - `typescript ~6.0.3` everywhere
    - restore `@typescript/native-preview` and the `tsgo` scripts
    - keep the bun-plugin cleanup
    - say in the commit body why
- [ ] **Step 5:** Gate. The smoke output still equals the Baseline table.
- [ ] **Step 6:** Commit `chore(deps): typescript 7.0 (native tsc), drop native-preview`.

### Task 7: Ink 8 and React 19.3

**Files:**
- `packages/tui-adapter-ink/package.json`:
  - `ink ^8.0.0`
  - move `react` from `dependencies` to `peerDependencies: ">=19.3.0"`, plus `devDependencies: "^19.3.1"`
  - `react-dom ^19.3.1`, `@types/react ^19.3.0`, `@types/react-dom ^19.3.0`
  - add `"engines": { "node": ">=22" }`
  - D2: remove `main`, `exports["."].require`, and point `module` and `exports["."].import` at the ESM files only
- `packages/tui-adapter-ink/tsdown.config.mts`: `format: ['esm']` (D2)
- `packages/tui-adapter-react/package.json`: `react ^19.3.1`, `@types/react ^19.3.0`, so the lockfile holds a single React.
- `packages/tui-adapter-ink/src/fullscreen/use_screen_size.ts`
- `packages/tui-adapter-ink/src/__tests__/setup.ts:23-37` (the ink mock)
- Test: `packages/tui-adapter-ink/src/__tests__/integration/keyboard.spec.tsx` (new)

- [ ] **Step 1: Write the key-mapping test while still on Ink 6.**
  - Use `createTestScreenManager()` and `testRender()` from `integration/test_helpers.ts`, with a prompt screen in input mode.
  - Test `escape exits prompt input mode`: write `'\u001b'` to the fake stdin, then `expect(screen.isPromptInInputMode()).toBe(false)`.
  - Test `backspace deletes the last typed character`: type `'ab'`, write `'\u007f'`, then expect the prompt's current value to be `'a'`.
- [ ] **Step 2:** `cd packages/tui-adapter-ink && yarn run -T vitest run src/__tests__/integration/keyboard.spec.tsx`.
  - Record the result in the Task 7 commit body. If `escape` FAILS, Review Focus item 3 is confirmed.
  - If both pass, note that the suspected bug doesn't exist, and keep the tests.
- [ ] **Step 3:** Apply the `package.json`/tsdown edits, then `yarn install`.
- [ ] **Step 4: Rewrite `useScreenSize(): ScreenSize` on top of ink's `useWindowSize(): { readonly columns: number; readonly rows: number }`.**
  - Map the result to `{ width: columns, height: rows }`.
  - Keep the exported `ScreenSize` interface and function signature.
  - Delete the manual `resize` listener; `useWindowSize` re-renders on resize.
  - Ink 8's types no longer include `stdout.columns/rows`, so the current code fails `check`.
- [ ] **Step 5:** Add `useWindowSize: () => ({ columns: 80, rows: 24 })` to the `vi.mock('ink', ...)` factory in `__tests__/setup.ts`.
- [ ] **Step 6:** `yarn build --force`.
  - Both keyboard tests PASS.
  - The integration snapshots are unchanged. Ink 8 now writes `'\n'` as its last frame on unmount, but the tests read `lastFrame()` before unmounting.
- [ ] **Step 7:** Gate. The smoke output for tui-adapter-ink is `node-esm=ok node-cjs=n/a bun-esm=ok`; the other rows are unchanged.
- [ ] **Step 8:** Commit `feat(tui-adapter-ink)!: ink 8, react >=19.3 peer, node >=22, ESM-only`.

### Task 8: OpenTUI 0.9.7

**Files:**
- `packages/tui-adapter-react/package.json` and `packages/tui-adapter-solid/package.json`:
  - `@opentui/*` → `^0.9.7`
  - add `"web-tree-sitter": "0.25.10"` to `dependencies`, so consumers get the peer `@opentui/core` requires for `<code>`/`<diff>`
  - add `"engines": { "bun": ">=1.3.14", "node": ">=26.4.0" }`, mirroring `@opentui/core`
  - D2: remove `main` and `exports["."].require`
- `packages/{tui-adapter-react,tui-adapter-solid}/tsdown.config.mts`: `format: ['esm']` (D2)
- `packages/commander-tui/package.json`:
  - add `@opentui/core` as an optional peer `^0.9.7` (`peerDependenciesMeta`) and as a devDependency `^0.9.7`
  - It is imported in published types (`types/file.types.ts`, `types/log.types.ts`, `types/screen.types.ts`, `adapters/interface.ts`) and dynamically at `services/screen_manager.ts:170`, but it isn't declared today.
- `packages/commander-tui/src/services/screen_manager.ts:175`: `useAlternateScreen: true` → `screenMode: 'alternate-screen'`. The option was removed in 0.1.93; `ScreenMode = "alternate-screen" | "main-screen" | "split-footer"`.
- `packages/commander-tui/src/services/screen_manager.ts:311`: after `this.renderer.destroy()`, add `await this.renderer.closed`. Both exist on `CliRenderer` in 0.9.7, and `unbind()` (`:285`) is already async.
- `packages/tui-adapter-react/src/context/logger_context.tsx:70`: `SyntaxStyle.create()` → `SyntaxStyle.create(renderer.nativeScene)`, with `const renderer = useRenderer()` from `@opentui/react`.
- `packages/tui-adapter-solid/src/context/logger_context.tsx:62`: the same change, with `useRenderer` from `@opentui/solid`. Since 0.6.0, `static create(source: NativeResourceOwner)`.
- Test: `packages/commander-tui/src/__tests__/services/` (extend the existing screen-manager spec, or add `screen_manager_unbind.spec.ts`).

- [ ] **Step 1: Write the teardown-order test first.**
  - Test `unbind waits for renderer.closed before flushing screens`:
    - Create a mock renderer with `destroy: vi.fn()` and `closed` as a promise you resolve by hand.
    - Spy on `process.stdout.write`.
    - Call `unbind()` without awaiting it.
    - Expect zero screen-flush writes. Resolve `closed`, await `unbind()`, then expect the flush writes.
  - Extend the `@opentui/core` mock in `__tests__/setup.ts:11-38` only as far as this needs.
- [ ] **Step 2:** `cd packages/commander-tui && yarn run -T vitest run` → the new test FAILS (writes happen before `closed` resolves).
- [ ] **Step 3:** Apply all the file edits above, then `yarn install`. Check that `@opentui/core` resolves to a single 0.9.7 in `yarn.lock`.
- [ ] **Step 4:** `yarn build --force`.
  - The new test PASSES.
  - The bun test counts are at least the baseline.
  - `bun test` output in `packages/tui-adapter-react` no longer contains `TreeSitter worker error`.
  - If `testRender` snapshots change, accept them only where the diff comes from 0.9.0 behaviour: siblings with the same `zIndex` now paint in child order, and removed props become `undefined`. Anything else is a regression to investigate.
- [ ] **Step 5:** Gate. Expected smoke output for tui-adapter-react and tui-adapter-solid: `node-esm=FAIL … node-cjs=n/a bun-esm=ok`. Node needs 26.4+ with `--experimental-ffi`, and `commander.factory.mts:206-209` only loads these adapters under Bun.
- [ ] **Step 6 (manual; the user runs it in a real terminal):**
  1. `cd examples/commander-tui && bun src/index.ts` with the react adapter, then again with the solid adapter.
  2. Exit with Ctrl+C.
  3. The shell prompt comes back on the normal screen, buffered log output is printed below it, and mouse-tracking escape codes don't echo when the mouse moves.
- [ ] **Step 7:** Commit `feat(tui-adapters)!: OpenTUI 0.9.7, ESM-only; commander-tui declares @opentui/core peer`.

### Task 9: Changelogs and version bumps (no publish)

**Files:** `packages/*/CHANGELOG.md`, `packages/*/package.json` (`version`)

This follows CLAUDE.md's release process, steps 1–2 only. Proposed versions:

| Package | Now | Next | Why |
|---|---|---|---|
| @navios/tui-adapter-ink | 1.2.1 | 2.0.0 | Ink 8; `react` is now a peer `>=19.3`; Node ≥22; ESM-only |
| @navios/tui-adapter-react | 1.2.0 | 2.0.0 | OpenTUI 0.9 (Bun ≥1.3.14); `SyntaxStyle` needs an owner; ESM-only |
| @navios/tui-adapter-solid | 1.1.1 | 2.0.0 | Same as react |
| @navios/commander-tui | 1.6.2 | 1.7.0 | Optional peer `@opentui/core ^0.9.7`; `screenMode`; teardown now awaited |
| @navios/commander | 1.8.0 | 1.8.1 | Dependency bumps only |

- [ ] **Step 1:** Write one CHANGELOG entry per package. List the breaking changes from the table, plus "custom `SyntaxStyle` must be created with `SyntaxStyle.create(renderer.nativeScene)`" for the react and solid adapters.
- [ ] **Step 2:** Bump the `version` fields, then run the Gate.
- [ ] **Step 3:** Commit `release: prepare dependency-upgrade versions`. Do not tag or publish.

## Follow-ups (not in this plan)

- **Replace `ink-syntax-highlight`.** It is last published 2025-01, its peers are ink ^5 and react ^18, and it pulls in highlight.js 10, which is end-of-life. A replacement is a local ~10-line `<Text>{highlight(code)}</Text>` (`file_log.tsx:2,121,200`).
- **Vite 8** once unplugin-swc is confirmed working on it.
- **TypeScript 7.1** when stable, to get rolldown-plugin-dts's supported tsgo API path.
- **Declare `chalk` and `esbuild`,** which `bun-plugin.mts` imports through hoisting today.
- **Make `react` a peer in `tui-adapter-react`,** as Task 7 does for ink.
- **Adopt Ink's `render({ alternateScreen })` and `<Box contentOffsetY>`** in place of the manual escape sequences in `with_fullscreen.tsx` and `scroll_box.tsx:288`.
- **Tighten Yarn's new install-script and minimum-age defaults** in `.yarnrc.yml`.
