import { TextAttributes } from '@opentui/core'
import { For, Show, createMemo } from 'solid-js'

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

export function Sidebar(props: SidebarProps) {
  const theme = useTheme()

  // Separate screens: only "pending" status on top, everything else below
  const pendingScreens = createMemo(() => {
    const result: { screen: ScreenInstance; originalIndex: number }[] = []
    props.screens.forEach((screen, index) => {
      if (screen.getStatus() === 'pending') {
        result.push({ screen, originalIndex: index })
      }
    })
    return result
  })

  const otherScreens = createMemo(() => {
    const result: { screen: ScreenInstance; originalIndex: number }[] = []
    props.screens.forEach((screen, index) => {
      if (screen.getStatus() !== 'pending') {
        result.push({ screen, originalIndex: index })
      }
    })
    return result
  })

  const hasPending = () => pendingScreens().length > 0
  const hasOther = () => otherScreens().length > 0
  const showSeparator = () => hasPending() && hasOther()

  return (
    <box
      flexDirection="column"
      width={props.width}
      borderColor={props.focused ? theme.sidebar.focusBorder : theme.sidebar.border}
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
          {props.title}
        </text>
      </box>

      {/* Screen list */}
      <scrollbox scrollY stickyScroll={false} flexGrow={1} contentOptions={{ flexGrow: 1 }}>
        <box flexDirection="column">
          {/* Pending screens (active work) */}
          <For each={pendingScreens()}>
            {({ screen, originalIndex }) => (
              <SidebarItem
                screen={screen}
                isSelected={originalIndex === props.selectedIndex}
                isActive={screen.getId() === props.activeScreenId}
                focused={props.focused}
              />
            )}
          </For>

          {/* Separator between pending and other screens */}
          <Show when={showSeparator()}>
            <SidebarSeparator />
          </Show>

          {/* Other screens (waiting, success, fail) */}
          <For each={otherScreens()}>
            {({ screen, originalIndex }) => (
              <SidebarItem
                screen={screen}
                isSelected={originalIndex === props.selectedIndex}
                isActive={screen.getId() === props.activeScreenId}
                focused={props.focused}
              />
            )}
          </For>
        </box>
      </scrollbox>

      {/* Footer with keybindings hint */}
      <box paddingLeft={1} paddingRight={1} borderColor={theme.sidebar.border} border={['top']}>
        <text fg={theme.sidebar.text}>q: exit | Tab: focus | ?: help</text>
      </box>
    </box>
  )
}
