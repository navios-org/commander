import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { renderHook, act } from '@testing-library/react'

import { MANAGER_EVENTS } from '@navios/commander-tui'
import { useManagerSubscription } from '../../hooks/use_manager_subscription.ts'
import { createMockScreenManagerInstance, asMockManager } from '../mocks/factories.ts'

// Import setup to apply mocks
import '../setup.ts'

describe('useManagerSubscription', () => {
  beforeEach(() => {
    // Reset mocks before each test
  })

  it('should subscribe to all MANAGER_EVENTS on mount', () => {
    const mockManager = createMockScreenManagerInstance()

    renderHook(() => useManagerSubscription(asMockManager(mockManager)))

    // Should have called on() for each event
    expect(mockManager.on).toHaveBeenCalledTimes(MANAGER_EVENTS.length)
  })

  it('should unsubscribe from all MANAGER_EVENTS on unmount', () => {
    const mockManager = createMockScreenManagerInstance()

    const { unmount } = renderHook(() => useManagerSubscription(asMockManager(mockManager)))
    unmount()

    // Should have called off() for each event
    expect(mockManager.off).toHaveBeenCalledTimes(MANAGER_EVENTS.length)
  })

  it('should return a forceUpdate function', () => {
    const mockManager = createMockScreenManagerInstance()

    const { result } = renderHook(() => useManagerSubscription(asMockManager(mockManager)))

    expect(typeof result.current).toBe('function')
  })

  it('should trigger re-render when forceUpdate is called', () => {
    const mockManager = createMockScreenManagerInstance()
    let renderCount = 0

    const { result } = renderHook(() => {
      renderCount++
      return useManagerSubscription(asMockManager(mockManager))
    })

    const initialRenderCount = renderCount

    act(() => {
      result.current()
    })

    expect(renderCount).toBeGreaterThan(initialRenderCount)
  })

  it('should resubscribe when manager changes', () => {
    const mockManager1 = createMockScreenManagerInstance()
    const mockManager2 = createMockScreenManagerInstance()

    const { rerender } = renderHook(
      ({ manager }) => useManagerSubscription(manager),
      { initialProps: { manager: asMockManager(mockManager1) } },
    )

    // First manager should be subscribed
    expect(mockManager1.on).toHaveBeenCalled()

    // Change manager
    rerender({ manager: asMockManager(mockManager2) })

    // First manager should be unsubscribed
    expect(mockManager1.off).toHaveBeenCalled()
    // Second manager should be subscribed
    expect(mockManager2.on).toHaveBeenCalled()
  })
})
