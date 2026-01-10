import { InjectionToken } from '@navios/core'

import type { HelpCommand } from '../overrides/help.command.mjs'

export const HelpCommandToken = InjectionToken.create<HelpCommand>('HelpCommand')
