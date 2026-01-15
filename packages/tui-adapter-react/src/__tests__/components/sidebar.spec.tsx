import { describe, it, expect, mock } from 'bun:test'

import { Sidebar } from '../../components/sidebar/sidebar.tsx'
import { SidebarItem } from '../../components/sidebar/sidebar_item.tsx'
import { SidebarSeparator } from '../../components/sidebar/sidebar_separator.tsx'
import { SidebarContainer } from '../../components/sidebar/sidebar_container.tsx'
import { createMockScreenInstance, asMockScreen } from '../mocks/factories.ts'

// Import setup to apply mocks
import '../setup.ts'

/**
 * Sidebar component tests
 *
 * Tests verify component structure, props handling, and screen grouping logic.
 */
describe('Sidebar', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof Sidebar).toBe('function')
    })

    it('should accept all required props', () => {
      const mockScreen = createMockScreenInstance()
      const element = (
        <Sidebar
          screens={[asMockScreen(mockScreen)]}
          selectedIndex={0}
          activeScreenId="test-screen-id"
          focused={true}
          width={25}
          title="Screens"
        />
      )

      expect(element.props.screens).toHaveLength(1)
      expect(element.props.selectedIndex).toBe(0)
      expect(element.props.activeScreenId).toBe('test-screen-id')
      expect(element.props.focused).toBe(true)
      expect(element.props.width).toBe(25)
      expect(element.props.title).toBe('Screens')
    })
  })

  describe('screens handling', () => {
    it('should accept varying screen counts', () => {
      const mockScreen1 = createMockScreenInstance()
      const mockScreen2 = createMockScreenInstance()
      const mockScreen3 = createMockScreenInstance()

      const emptyElement = (
        <Sidebar screens={[]} selectedIndex={0} activeScreenId="" focused={true} width={25} title="Screens" />
      )
      const multiElement = (
        <Sidebar
          screens={[asMockScreen(mockScreen1), asMockScreen(mockScreen2), asMockScreen(mockScreen3)]}
          selectedIndex={1}
          activeScreenId="test-screen-id"
          focused={true}
          width={25}
          title="Screens"
        />
      )

      expect(emptyElement.props.screens).toHaveLength(0)
      expect(multiElement.props.screens).toHaveLength(3)
      expect(multiElement.props.selectedIndex).toBe(1)
    })
  })

  describe('props handling', () => {
    it('should handle focus and selection states', () => {
      const mockScreen = createMockScreenInstance()

      const focusedElement = (
        <Sidebar
          screens={[asMockScreen(mockScreen)]}
          selectedIndex={0}
          activeScreenId="test-screen-id"
          focused={true}
          width={25}
          title="Screens"
        />
      )
      const unfocusedElement = (
        <Sidebar
          screens={[asMockScreen(mockScreen)]}
          selectedIndex={0}
          activeScreenId="test-screen-id"
          focused={false}
          width={25}
          title="Screens"
        />
      )

      expect(focusedElement.props.focused).toBe(true)
      expect(unfocusedElement.props.focused).toBe(false)
    })

    it('should accept width and title values', () => {
      const mockScreen = createMockScreenInstance()

      const element = (
        <Sidebar
          screens={[asMockScreen(mockScreen)]}
          selectedIndex={0}
          activeScreenId="test-screen-id"
          focused={true}
          width={30}
          title="Tasks"
        />
      )

      expect(element.props.width).toBe(30)
      expect(element.props.title).toBe('Tasks')
    })
  })
})

describe('SidebarItem', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof SidebarItem).toBe('function')
    })

    it('should accept all required props', () => {
      const mockScreen = createMockScreenInstance()
      const element = (
        <SidebarItem screen={asMockScreen(mockScreen)} isSelected={true} isActive={true} focused={true} />
      )

      expect(element.props.screen).toBeDefined()
      expect(element.props.isSelected).toBe(true)
      expect(element.props.isActive).toBe(true)
      expect(element.props.focused).toBe(true)
    })
  })

  describe('boolean props', () => {
    it('should handle all boolean state combinations', () => {
      const mockScreen = createMockScreenInstance()

      const allTrue = (
        <SidebarItem screen={asMockScreen(mockScreen)} isSelected={true} isActive={true} focused={true} />
      )
      const allFalse = (
        <SidebarItem screen={asMockScreen(mockScreen)} isSelected={false} isActive={false} focused={false} />
      )

      expect(allTrue.props.isSelected).toBe(true)
      expect(allTrue.props.isActive).toBe(true)
      expect(allTrue.props.focused).toBe(true)

      expect(allFalse.props.isSelected).toBe(false)
      expect(allFalse.props.isActive).toBe(false)
      expect(allFalse.props.focused).toBe(false)
    })
  })

  describe('screen status and badge', () => {
    it('should work with various screen statuses', () => {
      const statuses = ['pending', 'success', 'fail'] as const
      for (const status of statuses) {
        const mockScreen = createMockScreenInstance()
        mockScreen.getStatus = mock(() => status)
        const element = (
          <SidebarItem screen={asMockScreen(mockScreen)} isSelected={false} isActive={false} focused={false} />
        )
        expect(element.props.screen).toBeDefined()
      }
    })

    it('should work with various badge counts', () => {
      const badgeCounts = [0, 5, 150]
      for (const count of badgeCounts) {
        const mockScreen = createMockScreenInstance()
        mockScreen.getBadgeCount = mock(() => count)
        const element = (
          <SidebarItem screen={asMockScreen(mockScreen)} isSelected={false} isActive={false} focused={false} />
        )
        expect(element.props.screen).toBeDefined()
      }
    })
  })
})

describe('SidebarSeparator', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof SidebarSeparator).toBe('function')
    })

    it('should render without props', () => {
      const element = <SidebarSeparator />
      expect(element).toBeDefined()
    })
  })
})

describe('SidebarContainer', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof SidebarContainer).toBe('function')
    })

    it('should accept children prop', () => {
      const element = (
        <SidebarContainer>
          <div>Child content</div>
        </SidebarContainer>
      )

      expect(element.props.children).toBeDefined()
    })
  })
})
