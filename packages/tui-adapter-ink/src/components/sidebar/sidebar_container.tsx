import { useState, useEffect, useMemo } from 'react'

import { SIDEBAR_EVENTS } from '@navios/commander-tui'
import type { ScreenManagerInstance } from '@navios/commander-tui'

import { Sidebar } from './sidebar.tsx'

export interface SidebarContainerProps {
  manager: ScreenManagerInstance
  width: number
  title: string
}

/**
 * Container component that manages sidebar subscriptions.
 * Only re-renders when sidebar-relevant events fire.
 */
export function SidebarContainer({ manager, width, title }: SidebarContainerProps) {
  const [, forceUpdate] = useState({})

  // Subscribe only to events that affect sidebar rendering
  useEffect(() => {
    const handleUpdate = () => forceUpdate({})

    for (const event of SIDEBAR_EVENTS) {
      manager.on(event, handleUpdate)
    }

    return () => {
      for (const event of SIDEBAR_EVENTS) {
        manager.off(event, handleUpdate)
      }
    }
  }, [manager])

  // Derive sidebar state from manager
  const screens = manager.getScreens()
  const activeScreen = manager.getActiveScreen()
  const activeScreenId = activeScreen?.getId() ?? screens[0]?.getId() ?? ''
  const hasSidebar = screens.length > 1

  // Memoize sidebar props to prevent unnecessary child re-renders
  const sidebarProps = useMemo(
    () => ({
      screens,
      selectedIndex: manager.selectedIndex,
      activeScreenId,
      focused: manager.focusArea === 'sidebar',
      width,
      title,
    }),
    [screens, manager.selectedIndex, activeScreenId, manager.focusArea, width, title],
  )

  if (!hasSidebar) {
    return null
  }

  return <Sidebar {...sidebarProps} />
}
