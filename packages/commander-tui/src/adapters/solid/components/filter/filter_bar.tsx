import { TextAttributes } from '@opentui/core'
import { Show, For } from 'solid-js'

import type { LogLevel } from '@navios/core'

import { useTheme } from '../../hooks/index.ts'
import { ALL_LOG_LEVELS } from '../../../../types/index.ts'

import type { FilterState, LevelCounts } from '../../../../types/index.ts'

export interface FilterBarProps {
  filter: FilterState
  levelCounts: LevelCounts
}

const LEVEL_LABELS: Record<LogLevel, string> = {
  verbose: 'V',
  debug: 'D',
  log: 'L',
  warn: 'W',
  error: 'E',
  fatal: 'F',
}

export function FilterBar(props: FilterBarProps) {
  const theme = useTheme()
  const isSearchFocused = () => props.filter.focusedField === 'search'

  return (
    <box
      flexDirection="column"
      backgroundColor={theme.filter.background}
      borderColor={theme.filter.border}
      border={['bottom']}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Search input row */}
      <box flexDirection="row" gap={1}>
        <text fg={isSearchFocused() ? theme.colors.primary : theme.filter.textDim}>/</text>
        <text fg={props.filter.searchQuery ? theme.filter.inputText : theme.filter.inputPlaceholder}>
          {props.filter.searchQuery || 'Search logs...'}
        </text>
        <Show when={isSearchFocused()}>
          <text fg={theme.filter.cursor} attributes={TextAttributes.BLINK}>
            _
          </text>
        </Show>
      </box>

      {/* Level filters row */}
      <box flexDirection="row" gap={1}>
        <text fg={theme.filter.textDim}>Levels:</text>
        <For each={ALL_LOG_LEVELS}>
          {(level, index) => {
            const isEnabled = () => props.filter.enabledLevels.has(level)
            const count = () => props.levelCounts[level]
            const levelColor = () => theme.logLevels[level].border
            const isLevelsFocused = () => props.filter.focusedField === 'levels'

            return (
              <box flexDirection="row">
                <text
                  fg={isEnabled() ? levelColor() : theme.filter.inactiveLevel}
                  attributes={isLevelsFocused() ? TextAttributes.BOLD : undefined}
                >
                  {index() + 1}:{LEVEL_LABELS[level]}
                </text>
                <Show when={count() > 0}>
                  <text fg={theme.filter.textDim}>({count() > 99 ? '99+' : count()})</text>
                </Show>
              </box>
            )
          }}
        </For>
      </box>

      {/* Hints */}
      <box flexDirection="row">
        <text fg={theme.filter.textDim}>Tab: switch fields | 1-7: toggle levels | Esc: close</text>
      </box>
    </box>
  )
}
