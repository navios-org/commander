import { describe, expect, it, vi } from 'vitest'

import { Sidebar } from '../../components/sidebar/sidebar.tsx'
import { wrapWithContext } from '../utils/render-utils.tsx'

import type { ScreenInstance } from '../../services/screen.ts'
import type { ScreenStatus } from '../../types/index.ts'

// Create mock ScreenInstance
function createMockScreen(overrides: {
  id?: string
  name?: string
  icon?: string
  badgeCount?: number
  status?: ScreenStatus
}): ScreenInstance {
  return {
    getId: vi.fn(() => overrides.id ?? 'screen-1'),
    getName: vi.fn(() => overrides.name ?? 'Test Screen'),
    getIcon: vi.fn(() => overrides.icon),
    getBadgeCount: vi.fn(() => overrides.badgeCount ?? 0),
    getStatus: vi.fn(() => overrides.status ?? 'pending'),
    isHidden: vi.fn(() => false),
  } as unknown as ScreenInstance
}

describe('Sidebar', () => {
  describe('screen list', () => {
    it('should render screen list', () => {
      const screens = [
        createMockScreen({ id: '1', name: 'Screen 1' }),
        createMockScreen({ id: '2', name: 'Screen 2' }),
        createMockScreen({ id: '3', name: 'Screen 3' }),
      ]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render active screen highlighted', () => {
      const screens = [
        createMockScreen({ id: '1', name: 'Screen 1' }),
        createMockScreen({ id: '2', name: 'Screen 2' }),
      ]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={1}
          activeScreenId="2"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('pending vs completed screens', () => {
    it('should separate pending from other screens', () => {
      const screens = [
        createMockScreen({ id: '1', name: 'Pending 1', status: 'pending' }),
        createMockScreen({ id: '2', name: 'Success', status: 'success' }),
        createMockScreen({ id: '3', name: 'Pending 2', status: 'pending' }),
        createMockScreen({ id: '4', name: 'Failed', status: 'fail' }),
      ]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Tasks"
        />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should show separator between pending and completed', () => {
      const screens = [
        createMockScreen({ id: '1', name: 'Active Task', status: 'pending' }),
        createMockScreen({ id: '2', name: 'Completed Task', status: 'success' }),
      ]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Tasks"
        />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should not show separator if no mix', () => {
      const screens = [
        createMockScreen({ id: '1', name: 'Task 1', status: 'pending' }),
        createMockScreen({ id: '2', name: 'Task 2', status: 'pending' }),
      ]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Tasks"
        />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('status indicators', () => {
    it('should render waiting status', () => {
      const screens = [createMockScreen({ id: '1', name: 'Waiting', status: 'waiting' })]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render pending status', () => {
      const screens = [createMockScreen({ id: '1', name: 'In Progress', status: 'pending' })]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render success status', () => {
      const screens = [createMockScreen({ id: '1', name: 'Completed', status: 'success' })]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render fail status', () => {
      const screens = [createMockScreen({ id: '1', name: 'Failed', status: 'fail' })]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('badge counts', () => {
    it('should render badge counts', () => {
      const screens = [
        createMockScreen({ id: '1', name: 'Messages', badgeCount: 5 }),
        createMockScreen({ id: '2', name: 'Notifications', badgeCount: 12 }),
        createMockScreen({ id: '3', name: 'Empty', badgeCount: 0 }),
      ]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('icons', () => {
    it('should render icons', () => {
      const screens = [
        createMockScreen({ id: '1', name: 'Build', icon: '🔨' }),
        createMockScreen({ id: '2', name: 'Test', icon: '🧪' }),
        createMockScreen({ id: '3', name: 'Deploy', icon: '🚀' }),
      ]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Pipeline"
        />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('focus state', () => {
    it('should render focused state', () => {
      const screens = [createMockScreen({ id: '1', name: 'Test' })]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render unfocused state', () => {
      const screens = [createMockScreen({ id: '1', name: 'Test' })]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={false}
          width={30}
          title="Screens"
        />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('title', () => {
    it('should render custom title', () => {
      const screens = [createMockScreen({ id: '1', name: 'Test' })]

      const component = wrapWithContext(
        <Sidebar
          screens={screens}
          selectedIndex={0}
          activeScreenId="1"
          focused={true}
          width={30}
          title="Custom Title"
        />,
      )

      expect(component).toMatchSnapshot()
    })
  })
})
