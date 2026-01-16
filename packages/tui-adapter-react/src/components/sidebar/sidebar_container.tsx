import type { ScreenManagerInstance } from '@navios/commander-tui'

import { useScreenList, useSidebarIndex, useFocusArea, useActiveScreen } from '../../hooks/index.ts'

import { Sidebar } from './sidebar.tsx'

export interface SidebarContainerProps {
  manager: ScreenManagerInstance
  width: number
  title: string
}

/**
 * Container component that manages sidebar subscriptions.
 * Uses useSyncExternalStore-based hooks for proper React 18 concurrent mode support.
 */
export function SidebarContainer({ manager, width, title }: SidebarContainerProps) {
  const screens = useScreenList(manager)
  const sidebarIndex = useSidebarIndex(manager)
  const focusArea = useFocusArea(manager)
  const activeScreen = useActiveScreen(manager)

  if (screens.length <= 1) {
    return null
  }

  const activeScreenId = activeScreen?.getId() ?? screens[0]?.getId() ?? ''

  return (
    <Sidebar
      screens={screens}
      selectedIndex={sidebarIndex}
      activeScreenId={activeScreenId}
      focused={focusArea === 'sidebar'}
      width={width}
      title={title}
    />
  )
}
