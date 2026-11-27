import { handlerChain, resolveChain } from '@navios/core/transport'

import type { ClassType, HandlerInfo } from '@navios/core'
import type { ModuleNode, ResolvedChain, TransportHost } from '@navios/core/transport'

import type { CommandContext } from '../command/command-context.mjs'
import type { CommandMetadata } from '../command/command-metadata.mjs'
import type { CommandResult } from '../command/command.mjs'

export interface CommandChain {
  info: HandlerInfo
  resolved: ResolvedChain<CommandContext, CommandResult>
}

const NO_EXTRAS = { guards: [], interceptors: [], attributes: new Map<symbol, unknown>() }

/**
 * The guards and interceptors of a command, in the order every transport of
 * the application runs them, and their instances.
 */
export async function commandChain(
  host: TransportHost,
  node: ModuleNode,
  command: ClassType,
  metadata: CommandMetadata,
): Promise<CommandChain> {
  const chain = handlerChain({
    application: host.interceptors,
    node,
    controller: command,
    owner: metadata.owner,
    handlerName: 'execute',
    member: metadata.owner.members.get('execute') ?? NO_EXTRAS,
  })
  const resolved = await resolveChain<CommandContext, CommandResult>(host.container, chain)
  return { info: chain.info, resolved }
}
