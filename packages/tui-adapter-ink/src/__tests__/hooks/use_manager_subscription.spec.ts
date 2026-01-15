import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { MANAGER_EVENTS } from '@navios/commander-tui'
import { useManagerSubscription } from '../../hooks/use_manager_subscription.ts'
import { createMockScreenManagerInstance, asMockManager } from '../mocks/factories.ts'

describe('useManagerSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should subscribe to all MANAGER_EVENTS on mount', () => {
    const mockManager = createMockScreenManagerInstance()

    renderHook(() => useManagerSubscription(asMockManager(mockManager)))

    // Should have called on() for each event
    expect(mockManager.on).toHaveBeenCalledTimes(MANAGER_EVENTS.length)

    // Verify each event was subscribed
    for (const event of MANAGER_EVENTS) {
      expect(mockManager.on).toHaveBeenCalledWith(event, expect.any(Function))
    }
  })

  it('should unsubscribe from all MANAGER_EVENTS on unmount', () => {
    const mockManager = createMockScreenManagerInstance()

    const { unmount } = renderHook(() => useManagerSubscription(asMockManager(mockManager)))
    unmount()

    // Should have called off() for each event
    expect(mockManager.off).toHaveBeenCalledTimes(MANAGER_EVENTS.length)

    // Verify each event was unsubscribed
    for (const event of MANAGER_EVENTS) {
      expect(mockManager.off).toHaveBeenCalledWith(event, expect.any(Function))
    }
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

  it('should trigger re-render when manager event fires', () => {
    const mockManager = createMockScreenManagerInstance()
    let eventHandler: () => void

    // Capture the event handler when on() is called
    mockManager.on.mockImplementation((event: string, handler: () => void) => {
      if (event === 'screen:added') {
        eventHandler = handler
      }
    })

    let renderCount = 0
    renderHook(() => {
      renderCount++
      return useManagerSubscription(asMockManager(mockManager))
    })

    const initialRenderCount = renderCount

    // Simulate manager firing event
    act(() => {
      eventHandler!()
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
