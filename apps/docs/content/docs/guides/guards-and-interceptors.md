---
title: Guards and interceptors
---

# Guards and interceptors

Guards decide whether a command may run. Interceptors run around it. Both are the ones of `@navios/core`, and work the same on every transport.

## A guard

A guard is a service with `canActivate()`. Anything but `true` refuses.

```ts
import { Injectable } from '@navios/core'

import type { ExecutionContext, Guard } from '@navios/core'

@Injectable()
export class RequireLogin implements Guard {
  private readonly session = inject(SessionStore)

  async canActivate(ctx: ExecutionContext) {
    return (await this.session.read()) !== null
  }
}
```

Attach it to a command, or to a module for every command of that module and of the modules it imports:

```ts
@Command({ path: 'deploy <env>', guards: [RequireLogin] })
export class DeployCommand { /* ... */ }

@Module({ commands: [DeployCommand, RollbackCommand], guards: [RequireLogin] })
export class ReleaseModule {}
```

`@UseGuards(RequireLogin)` above `@Command` does the same as the `guards` option.

A command that is refused does not run. The process exits with 1:

```console
$ mycli deploy staging
mycli: deploy: not allowed by RequireLogin
```

For a better message, throw a `CliError` from the guard instead of returning `false`:

```ts
throw new CliError('You are not logged in. Run "mycli login" first.')
```

## Reading the command in a guard

A guard receives the context of the transport that called it. `isCommandContext()` narrows it to a `CommandContext`, with the path and the validated options:

```ts
import { isCommandContext } from '@navios/commander'

canActivate(ctx: ExecutionContext) {
  if (!isCommandContext(ctx)) {
    return true // not a command line: another transport has its own rules
  }
  return ctx.path !== 'deploy' || ctx.options.env !== 'production' || this.isAdmin()
}
```

## Attributes

An attribute is a typed value attached to a command, for guards and interceptors to read. Use it instead of comparing paths:

```ts
import { AttributeFactory } from '@navios/core'

export const Role = AttributeFactory.createAttribute(Symbol.for('Role'), z.enum(['user', 'admin']))

@Command({ path: 'users delete <id>', attributes: [Role('admin')] })
export class DeleteUserCommand { /* ... */ }
```

```ts
canActivate(ctx: ExecutionContext) {
  const required = AttributeFactory.get(Role, ctx.handler) // 'admin' | null
  return required === null || this.session.role === required
}
```

An attribute set on a module applies to all its commands; one set on a command wins.

## An interceptor

An interceptor wraps the command. It sees the result and the error, and may replace either.

```ts
import type { ExecutionContext, Interceptor } from '@navios/core'

@Injectable()
export class Timing implements Interceptor {
  private readonly logger = inject(Logger, { context: 'Timing' })

  async intercept(ctx: ExecutionContext, next: () => Promise<unknown>) {
    const started = performance.now()
    try {
      return await next()
    } finally {
      this.logger.debug(`${ctx.handler.controller.name} took ${Math.round(performance.now() - started)} ms`)
    }
  }
}
```

```ts
@Command({ path: 'build', interceptors: [Timing] })
```

Attach it to a module with `interceptors: [Timing]`, or to every command of the application with `plugins`:

```ts
import { definePlugin } from '@navios/core'

const timing = definePlugin({
  name: 'timing',
  setup(api) {
    api.intercept(Timing)
  },
})

await runCli(AppModule, { plugins: [timing()] })
```

## The order

For one command: the interceptors of the application, then the guards of the modules, the command and `execute`, then the interceptors of the same three, then the command. An interceptor of the application therefore sees refused runs too, which is what logging and tracing need.

The schema has validated the options before any of them runs, so a guard can rely on `ctx.options`.
