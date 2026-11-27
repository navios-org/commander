---
title: Services and modules
---

# Services and modules

Commands should be thin: read the options, call a service, print the result. The services are plain classes that the dependency injection container of `@navios/core` builds and hands out.

## Services

```ts
import { inject, Injectable } from '@navios/core'

@Injectable()
export class ReleaseStore {
  async latest(env: string) { /* ... */ }
}

@Injectable()
export class Deployer {
  private readonly releases = inject(ReleaseStore)

  async deploy(env: string) {
    const release = await this.releases.latest(env)
    // ...
  }
}
```

A command injects them the same way, in a field:

```ts
@Command({ path: 'deploy <env>', options })
export class DeployCommand implements CommandHandler<typeof options> {
  private readonly deployer = inject(Deployer)

  async execute({ env }: CommandOptions<typeof options>) {
    await this.deployer.deploy(env)
  }
}
```

Nothing is built ahead of time. A service is constructed when the first thing that injects it is, and a command is constructed when it first runs. `mycli status` never builds what only `mycli deploy` needs.

The [DI documentation](https://navios.tech/docs/di/) covers tokens, factories, scopes and lifecycle hooks.

## Modules

A module lists the commands of one feature and imports the modules it builds on:

```ts
import { Module } from '@navios/core'

@Module({ commands: [MigrateCommand, SeedCommand] })
export class DatabaseModule {}

@Module({
  imports: [DatabaseModule],
  commands: [DeployCommand, StatusCommand],
})
export class AppModule {}
```

`commands` is an option that `@navios/commander` adds to `@Module`. Import anything from the package once, and TypeScript knows it.

A module may also carry what applies to all of its commands, and to those of the modules it imports:

```ts
@Module({
  commands: [DeployCommand, RollbackCommand],
  guards: [RequireLogin],
  providers: [provide(ReleaseStore, { class: S3ReleaseStore })],
})
export class ReleaseModule {}
```

## One module, several transports

Each transport reads its own option of `@Module` and ignores the others. The same module can therefore serve an HTTP API and a command line:

```ts
@Module({
  controllers: [UsersController], // @navios/server
  commands: [CreateUserCommand], // @navios/commander
})
export class UsersModule {}
```

The server imports `UsersModule` and gets the controller; the CLI imports it and gets the command. Both use the same `UserService`.

## Replacing a service

Provide another implementation when you start the program:

```ts
import { provide } from '@navios/core'

await runCli(AppModule, {
  providers: [provide(ReleaseStore, { class: LocalReleaseStore })],
})
```

`provide()` takes a class, `{ class }`, `{ value }`, `{ factory }` or `{ existing }`. What the application provides wins over what modules provide, which is how a [test](/docs/guides/testing) swaps a service for a fake.

## Configuration

`provideConfig()` of `@navios/core` creates a token for configuration that is loaded and validated once, when it is first needed:

```ts title="config.ts"
import { provideConfig } from '@navios/core'

export const AppConfig = provideConfig({
  schema: z.object({ apiUrl: z.url(), token: z.string() }),
  load: () => ({ apiUrl: process.env.API_URL, token: process.env.API_TOKEN }),
})
```

```ts
@Injectable()
export class ApiClient {
  private readonly config = inject(AppConfig)

  request(path: string) {
    return fetch(this.config.getOrThrow('apiUrl') + path)
  }
}
```

A command that never touches the API runs without `API_URL` being set, because the configuration is not loaded for it.

See [Config and logging](https://navios.tech/docs/server/essentials/config-and-logging) in the Navios documentation for the details.

## Cleaning up

A service that holds a connection closes it in `onServiceDestroy()`. `runCli()` closes the application after the command, which calls the hook:

```ts
@Injectable()
export class Database implements OnServiceDestroy {
  private readonly pool = createPool()

  async onServiceDestroy() {
    await this.pool.end()
  }
}
```

This is why a command returns an exit code, or throws, and does not call `process.exit()`.
