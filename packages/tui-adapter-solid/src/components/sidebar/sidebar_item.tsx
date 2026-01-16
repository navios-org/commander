import { TextAttributes } from '@opentui/core'
import { Show } from 'solid-js'

import type { ScreenInstance } from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'

export interface SidebarItemProps {
  screen: ScreenInstance
  isSelected: boolean
  isActive: boolean
  focused: boolean
}

export function SidebarItem(props: SidebarItemProps) {
  const theme = useTheme()
  const status = () => props.screen.getStatus()
  const statusIndicator = () => theme.statusIndicators[status()]

  // Determine background color based on state
  const backgroundColor = () => {
    if (props.isSelected && props.focused) {
      return theme.sidebar.selectedBackground
    } else if (props.isActive) {
      return theme.sidebar.selectedBackground + '80'
    }
    return undefined
  }

  return (
    <box flexDirection="row" paddingLeft={1} paddingRight={1} backgroundColor={backgroundColor()}>
      {/* Selection indicator */}
      <text fg={props.isSelected && props.focused ? theme.sidebar.focusBorder : 'transparent'}>
        {'>'}{' '}
      </text>

      {/* Status indicator */}
      <text fg={statusIndicator().color}>{statusIndicator().icon} </text>

      {/* Screen name */}
      <text fg={props.isActive ? theme.sidebar.text : theme.sidebar.textDim} flexGrow={1}>
        {props.screen.getName()}
      </text>

      {/* Badge if present */}
      <Show when={props.screen.getBadgeCount() > 0}>
        <box backgroundColor={theme.sidebar.badge} paddingLeft={1} paddingRight={1}>
          <text fg={theme.colors.foreground} attributes={TextAttributes.BOLD}>
            {props.screen.getBadgeCount() > 99 ? '99+' : props.screen.getBadgeCount()}
          </text>
        </box>
      </Show>
    </box>
  )
}
