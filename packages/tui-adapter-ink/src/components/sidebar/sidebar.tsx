import { Box, Text } from 'ink'

import type { ScreenInstance } from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'

import { SidebarItem } from './sidebar_item.tsx'
import { SidebarSeparator } from './sidebar_separator.tsx'

export interface SidebarProps {
  screens: ScreenInstance[]
  selectedIndex: number
  activeScreenId: string
  focused: boolean
  width: number
  title: string
}

export function Sidebar({
  screens,
  selectedIndex,
  activeScreenId,
  focused,
  width,
  title,
}: SidebarProps) {
  const theme = useTheme()

  // Separate screens: only "pending" status on top, everything else below
  const pendingScreens: { screen: ScreenInstance; originalIndex: number }[] = []
  const otherScreens: { screen: ScreenInstance; originalIndex: number }[] = []

  screens.forEach((screen, index) => {
    const status = screen.getStatus()
    if (status === 'pending') {
      pendingScreens.push({ screen, originalIndex: index })
    } else {
      otherScreens.push({ screen, originalIndex: index })
    }
  })

  const hasPending = pendingScreens.length > 0
  const hasOther = otherScreens.length > 0
  const showSeparator = hasPending && hasOther

  // Ink doesn't support partial borders, so we use box characters
  const borderColor = focused ? theme.sidebar.focusBorder : theme.sidebar.border

  return (
    <Box flexDirection="column" width={width} borderStyle="single" borderColor={borderColor}>
      {/* Sidebar header */}
      <Box backgroundColor={theme.header.background} paddingLeft={1} paddingRight={1}>
        <Text color={theme.header.text} bold>
          {title}
        </Text>
      </Box>

      {/* Screen list */}
      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        {/* Pending screens (active work) */}
        {pendingScreens.map(({ screen, originalIndex }) => (
          <SidebarItem
            key={screen.getId()}
            screen={screen}
            isSelected={originalIndex === selectedIndex}
            isActive={screen.getId() === activeScreenId}
            focused={focused}
          />
        ))}

        {/* Separator between pending and other screens */}
        {showSeparator && <SidebarSeparator />}

        {/* Other screens (waiting, success, fail) */}
        {otherScreens.map(({ screen, originalIndex }) => (
          <SidebarItem
            key={screen.getId()}
            screen={screen}
            isSelected={originalIndex === selectedIndex}
            isActive={screen.getId() === activeScreenId}
            focused={focused}
          />
        ))}
      </Box>

      {/* Footer with keybindings hint */}
      <Box
        paddingLeft={1}
        paddingRight={1}
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        borderColor={theme.sidebar.border}
      >
        <Text color={theme.sidebar.text}>q: exit | Tab: focus | ?: help</Text>
      </Box>
    </Box>
  )
}
