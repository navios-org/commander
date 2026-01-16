import { Box, Text } from 'ink'

import type { ScreenInstance } from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'

export interface SidebarItemProps {
  screen: ScreenInstance
  isSelected: boolean
  isActive: boolean
  focused: boolean
}

export function SidebarItem({ screen, isSelected, isActive, focused }: SidebarItemProps) {
  const theme = useTheme()
  const status = screen.getStatus()
  const statusIndicator = theme.statusIndicators[status]

  // Determine background color based on state
  // Note: Ink uses backgroundColor prop on Box
  let backgroundColor: string | undefined = undefined
  if (isSelected && focused) {
    backgroundColor = theme.sidebar.selectedBackground
  } else if (isActive) {
    // Ink doesn't support alpha in hex colors the same way
    // Use the selectedBackground with lower opacity approximation
    backgroundColor = theme.sidebar.selectedBackground
  }

  const badgeCount = screen.getBadgeCount()

  return (
    <Box flexDirection="row" paddingLeft={1} paddingRight={1}>
      {/* Selection indicator */}
      <Text color={isSelected && focused ? theme.sidebar.focusBorder : undefined}>
        {isSelected && focused ? '> ' : '  '}
      </Text>

      {/* Status indicator */}
      <Text color={statusIndicator.color}>{statusIndicator.icon} </Text>

      {/* Screen name */}
      <Text color={isActive ? theme.sidebar.text : theme.sidebar.textDim}>{screen.getName()}</Text>

      {/* Spacer */}
      <Box flexGrow={1} />

      {/* Badge if present */}
      {badgeCount > 0 && (
        <Text color={theme.colors.foreground} backgroundColor={theme.sidebar.badge} bold>
          {' '}
          {badgeCount > 99 ? '99+' : badgeCount}{' '}
        </Text>
      )}
    </Box>
  )
}
