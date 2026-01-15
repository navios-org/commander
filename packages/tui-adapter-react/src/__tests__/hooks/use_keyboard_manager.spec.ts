import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'

import { KeyboardManager } from '@navios/commander-tui'
import { useKeyboardManager } from '../../hooks/use_keyboard_manager.ts'
import { createMockScreenManagerInstance, createMockScreenInstance, asMockManager, asMockScreen } from '../mocks/factories.ts'

import type { FilterStateActions } from '../../hooks/use_filter_state.ts'

// Import setup to apply mocks
import '../setup.ts'

function createMockFilterActions(): FilterStateActions {
  return {
    toggleFilter: mock(() => {}),
    closeFilter: mock(() => {}),
    filterAppendChar: mock(() => {}),
    filterDeleteChar: mock(() => {}),
    filterToggleLevel: mock(() => {}),
    filterCycleField: mock(() => {}),
  }
}

describe('useKeyboardManager', () => {
  let mockManager: ReturnType<typeof createMockScreenManagerInstance>
  let mockFilterActions: FilterStateActions
  let mockToggleHelp: ReturnType<typeof mock>

  beforeEach(() => {
    mockManager = createMockScreenManagerInstance()
    mockFilterActions = createMockFilterActions()
    mockToggleHelp = mock(() => {})
  })

  describe('initialization', () => {
    it('should return a KeyboardManager instance', () => {
      const { result } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      expect(result.current.keyboardManager).toBeInstanceOf(KeyboardManager)
    })

    it('should return a handleKeyboard function', () => {
      const { result } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      expect(typeof result.current.handleKeyboard).toBe('function')
    })
  })

  describe('keyboardManager memoization', () => {
    it('should return same KeyboardManager instance on rerender with same deps', () => {
      const { result, rerender } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      const firstKm = result.current.keyboardManager

      rerender()

      expect(result.current.keyboardManager).toBe(firstKm)
    })

    it('should create new KeyboardManager when manager changes', () => {
      const { result, rerender } = renderHook(
        ({ manager }) =>
          useKeyboardManager(
            {
              manager,
              toggleHelp: mockToggleHelp,
              filterActions: mockFilterActions,
            },
            false,
            false,
          ),
        { initialProps: { manager: asMockManager(mockManager) } },
      )

      const firstKm = result.current.keyboardManager

      const newMockManager = createMockScreenManagerInstance()
      rerender({ manager: asMockManager(newMockManager) })

      expect(result.current.keyboardManager).not.toBe(firstKm)
    })
  })

  describe('handleKeyboard', () => {
    it('should query manager for screens when handling key', () => {
      const { result } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      act(() => {
        result.current.handleKeyboard({ name: 'a' })
      })

      expect(mockManager.getScreens).toHaveBeenCalled()
    })

    it('should query manager for active screen when handling key', () => {
      const { result } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      act(() => {
        result.current.handleKeyboard({ name: 'a' })
      })

      expect(mockManager.getActiveScreen).toHaveBeenCalled()
    })

    it('should check prompt state on active screen', () => {
      const mockScreen = createMockScreenInstance()
      mockManager.getActiveScreen = mock(() => asMockScreen(mockScreen))

      const { result } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      act(() => {
        result.current.handleKeyboard({ name: 'a' })
      })

      expect(mockScreen.hasActivePrompt).toHaveBeenCalled()
      expect(mockScreen.isPromptInInputMode).toHaveBeenCalled()
    })
  })

  describe('sidebar detection', () => {
    it('should query screens for sidebar detection when handling keys', () => {
      const mockScreen1 = createMockScreenInstance()
      const mockScreen2 = createMockScreenInstance()
      mockManager.getScreens = mock(() => [asMockScreen(mockScreen1), asMockScreen(mockScreen2)])
      mockManager.getActiveScreen = mock(() => asMockScreen(mockScreen1))

      const { result } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      act(() => {
        result.current.handleKeyboard({ name: 'tab' })
      })

      expect(mockManager.getScreens).toHaveBeenCalled()
    })
  })

  describe('handleKeyboard callback stability', () => {
    it('should return stable handleKeyboard reference when deps unchanged', () => {
      const { result, rerender } = renderHook(() =>
        useKeyboardManager(
          {
            manager: asMockManager(mockManager),
            toggleHelp: mockToggleHelp,
            filterActions: mockFilterActions,
          },
          false,
          false,
        ),
      )

      const firstHandler = result.current.handleKeyboard

      rerender()

      expect(result.current.handleKeyboard).toBe(firstHandler)
    })

    it('should update handleKeyboard when filterIsVisible changes', () => {
      const { result, rerender } = renderHook(
        ({ filterIsVisible }) =>
          useKeyboardManager(
            {
              manager: asMockManager(mockManager),
              toggleHelp: mockToggleHelp,
              filterActions: mockFilterActions,
            },
            filterIsVisible,
            false,
          ),
        { initialProps: { filterIsVisible: false } },
      )

      const firstHandler = result.current.handleKeyboard

      rerender({ filterIsVisible: true })

      expect(result.current.handleKeyboard).not.toBe(firstHandler)
    })

    it('should update handleKeyboard when showHelp changes', () => {
      const { result, rerender } = renderHook(
        ({ showHelp }) =>
          useKeyboardManager(
            {
              manager: asMockManager(mockManager),
              toggleHelp: mockToggleHelp,
              filterActions: mockFilterActions,
            },
            false,
            showHelp,
          ),
        { initialProps: { showHelp: false } },
      )

      const firstHandler = result.current.handleKeyboard

      rerender({ showHelp: true })

      expect(result.current.handleKeyboard).not.toBe(firstHandler)
    })
  })
})
