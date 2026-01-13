import { TextAttributes } from '@opentui/core'

import { useTheme } from '../../hooks/index.ts'

import type { ScreenInstance } from '../../../../services/index.ts'

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

  return (
    <box
      flexDirection="column"
      width={width}
      borderColor={focused ? theme.sidebar.focusBorder : theme.sidebar.border}
      border={['right']}
    >
      {/* Sidebar header */}
      <box
        backgroundColor={theme.header.background}
        paddingLeft={1}
        paddingRight={1}
        borderColor={theme.header.border}
        border={['bottom']}
      >
        <text fg={theme.header.text} attributes={TextAttributes.BOLD}>
          {title}
        </text>
      </box>

      {/* Screen list */}
      <scrollbox scrollY stickyScroll={false} flexGrow={1} contentOptions={{ flexGrow: 1 }}>
        <box flexDirection="column">
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
        </box>
      </scrollbox>

      {/* Footer with keybindings hint */}
      <box paddingLeft={1} paddingRight={1} borderColor={theme.sidebar.border} border={['top']}>
        <text fg={theme.sidebar.text}>q: exit | Tab: focus | ?: help</text>
      </box>
    </box>
  )
}
