# @navios/tui-adapter-ink

Draws the screens of [`@navios/commander-tui`](../commander-tui) with
[Ink](https://github.com/vadimdemedes/ink). No native code: it runs on Node.js 24 or later and on
Bun.

```bash
npm install @navios/commander-tui@next @navios/tui-adapter-ink@next react
```

```ts
import { runCli } from '@navios/commander'
import { tui } from '@navios/commander-tui'
import { inkAdapter } from '@navios/tui-adapter-ink'

await runCli(AppModule, { plugins: [tui({ adapter: inkAdapter() })] })
```

Importing the package registers nothing; the adapter is what you pass to `tui()`. Without the
plugin, pass it to the manager: `await manager.bind({ adapter: inkAdapter() })`.

The package also exports `ScrollBox` and the hooks and contexts its components use, for building
on them.

See [Adapters](../../apps/docs/content/docs/tui/adapters.md) for a comparison with the OpenTUI
adapter.

## License

MIT
