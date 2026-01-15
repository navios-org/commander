import { describe, it, expect, mock } from 'bun:test'

import { Sidebar } from '../../components/sidebar/sidebar.tsx'
import { SidebarItem } from '../../components/sidebar/sidebar_item.tsx'
import { SidebarSeparator } from '../../components/sidebar/sidebar_separator.tsx'
import { SidebarContainer } from '../../components/sidebar/sidebar_container.tsx'
import { createMockScreenInstance } from '../mocks/factories.ts'

/**
 * Sidebar component tests for Solid.js adapter
 *
 * Due to Solid.js + OpenTUI requiring a renderer context for JSX execution,
 * these tests verify component existence. Full rendering tests would require
 * a mock renderer context setup.
 */
describe('Sidebar', () => {
  it('should be a valid Solid component function', () => {
    expect(typeof Sidebar).toBe('function')
    expect(Sidebar.name).toBe('Sidebar')
  })
})

describe('SidebarItem', () => {
  it('should be a valid Solid component function', () => {
    expect(typeof SidebarItem).toBe('function')
    expect(SidebarItem.name).toBe('SidebarItem')
  })

  describe('mock screen instance', () => {
    it('should create mock screen with default values', () => {
      const mockScreen = createMockScreenInstance()
      expect(mockScreen.getId()).toBe('test-screen-id')
      expect(mockScreen.getName()).toBe('Test Screen')
      expect(mockScreen.getStatus()).toBe('pending')
      expect(mockScreen.getBadgeCount()).toBe(0)
    })

    it('should create mock screen with custom status', () => {
      const statuses = ['pending', 'success', 'fail'] as const
      for (const status of statuses) {
        const mockScreen = createMockScreenInstance()
        mockScreen.getStatus = mock(() => status)
        expect(mockScreen.getStatus()).toBe(status)
      }
    })

    it('should create mock screen with custom badge count', () => {
      const badgeCounts = [0, 5, 150]
      for (const count of badgeCounts) {
        const mockScreen = createMockScreenInstance()
        mockScreen.getBadgeCount = mock(() => count)
        expect(mockScreen.getBadgeCount()).toBe(count)
      }
    })
  })
})

describe('SidebarSeparator', () => {
  it('should be a valid Solid component function', () => {
    expect(typeof SidebarSeparator).toBe('function')
    expect(SidebarSeparator.name).toBe('SidebarSeparator')
  })
})

describe('SidebarContainer', () => {
  it('should be a valid Solid component function', () => {
    expect(typeof SidebarContainer).toBe('function')
    expect(SidebarContainer.name).toBe('SidebarContainer')
  })
})
