import { TextAttributes } from '@opentui/core'

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
  let backgroundColor: string | undefined = undefined
  if (isSelected && focused) {
    backgroundColor = theme.sidebar.selectedBackground
  } else if (isActive) {
    // Half transparent, where the colour is a plain #rrggbb that can take an alpha.
    const selected = theme.sidebar.selectedBackground
    backgroundColor = /^#[0-9a-f]{6}$/i.test(selected) ? selected + '80' : selected
  }

  return (
    <box flexDirection="row" paddingLeft={1} paddingRight={1} backgroundColor={backgroundColor}>
      {/* Selection indicator */}
      <text fg={isSelected && focused ? theme.sidebar.focusBorder : 'transparent'}>{'>'} </text>

      {/* Status indicator */}
      <text fg={statusIndicator.color}>{statusIndicator.icon} </text>

      {/* Screen name */}
      <text fg={isActive ? theme.sidebar.text : theme.sidebar.textDim} flexGrow={1}>
        {screen.getName()}
      </text>

      {/* Badge if present */}
      {screen.getBadgeCount() > 0 && (
        <box backgroundColor={theme.sidebar.badge} paddingLeft={1} paddingRight={1}>
          <text fg={theme.colors.foreground} attributes={TextAttributes.BOLD}>
            {screen.getBadgeCount() > 99 ? '99+' : screen.getBadgeCount()}
          </text>
        </box>
      )}
    </box>
  )
}
