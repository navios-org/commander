import { Box, Text } from 'ink'

import type { LogLevel } from '@navios/core'

import { useTheme } from '../../hooks/index.ts'
import { ALL_LOG_LEVELS } from '@navios/commander-tui'

import type { FilterState, LevelCounts } from '@navios/commander-tui'

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

export function FilterBar({ filter, levelCounts }: FilterBarProps) {
  const theme = useTheme()
  const isSearchFocused = filter.focusedField === 'search'

  return (
    <Box
      flexDirection="column"
      backgroundColor={theme.filter.background}
      borderStyle="single"
      borderBottom
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor={theme.filter.border}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Search input row */}
      <Box flexDirection="row" gap={1}>
        <Text color={isSearchFocused ? theme.colors.primary : theme.filter.textDim}>/</Text>
        <Text color={filter.searchQuery ? theme.filter.inputText : theme.filter.inputPlaceholder}>
          {filter.searchQuery || 'Search logs...'}
        </Text>
        {isSearchFocused && <Text color={theme.filter.cursor}>_</Text>}
      </Box>

      {/* Level filters row */}
      <Box flexDirection="row" gap={1}>
        <Text color={theme.filter.textDim}>Levels:</Text>
        {ALL_LOG_LEVELS.map((level, index) => {
          const isEnabled = filter.enabledLevels.has(level)
          const count = levelCounts[level]
          const levelColor = theme.logLevels[level].border
          const isLevelsFocused = filter.focusedField === 'levels'

          return (
            <Box key={level} flexDirection="row">
              <Text
                color={isEnabled ? levelColor : theme.filter.inactiveLevel}
                bold={isLevelsFocused}
              >
                {index + 1}:{LEVEL_LABELS[level]}
              </Text>
              {count > 0 && (
                <Text color={theme.filter.textDim}>({count > 99 ? '99+' : count})</Text>
              )}
            </Box>
          )
        })}
      </Box>

      {/* Hints */}
      <Box flexDirection="row">
        <Text color={theme.filter.textDim}>Tab: switch fields | 1-7: toggle levels | Esc: close</Text>
      </Box>
    </Box>
  )
}
