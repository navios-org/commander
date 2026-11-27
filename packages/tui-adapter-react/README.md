# @navios/tui-adapter-react

Draws the screens of [`@navios/commander-tui`](../commander-tui) with
[OpenTUI](https://github.com/sst/opentui) and React: native rendering, mouse support and
tree-sitter syntax highlighting.

OpenTUI needs **Bun**, or **Node.js 26.4+ started with `--experimental-ffi`**. Anywhere else the
adapter says so and the screens print to standard output, so a program that uses it still works.

```bash
npm install @navios/commander-tui@next @navios/tui-adapter-react@next react
```

```ts
import { runCli } from '@navios/commander'
import { tui } from '@navios/commander-tui'
import { openTuiAdapter } from '@navios/tui-adapter-react'

await runCli(AppModule, { plugins: [tui({ adapter: openTuiAdapter() })] })
```

`openTuiSupport()` tells whether OpenTUI can run in the current process, or why not.

The package is ESM only. Importing it registers nothing; the adapter is what you pass to `tui()`.

See [Adapters](../../apps/docs/content/docs/tui/adapters.md) for a comparison with the Ink
adapter.

## License

MIT
