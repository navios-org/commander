import type { FocusArea, RenderMode, ScreenStatus } from './screen.types.ts'

// ============================================
// ScreenManager Event Map (for Node.js EventEmitter generic)
// Event map format: { eventName: [arg1, arg2, ...] }
// ============================================

export interface ScreenManagerEventMap {
  'screen:added': [screenId: string]
  'screen:removed': [screenId: string]
  'screen:reordered': []
  'activeScreen:changed': [screenId: string | null]
  'focus:changed': [area: FocusArea]
  'sidebar:indexChanged': [index: number]
  'mode:changed': [mode: RenderMode]
}

export type ScreenManagerEventType = keyof ScreenManagerEventMap

/**
 * All manager events that adapters typically subscribe to for re-renders.
 */
export const MANAGER_EVENTS: ScreenManagerEventType[] = [
  'screen:added',
  'screen:removed',
  'screen:reordered',
  'activeScreen:changed',
  'focus:changed',
  'sidebar:indexChanged',
  'mode:changed',
]

// ============================================
// Screen Event Map (for Node.js EventEmitter generic)
// ============================================

export interface ScreenEventMap {
  'message:added': [messageId: string]
  'message:updated': [messageId: string]
  'messages:cleared': []
  'status:changed': [status: ScreenStatus]
  'visibility:changed': [hidden: boolean]
  'badge:changed': [count: number]
  'prompt:activated': []
  'prompt:updated': []
  'prompt:resolved': []
}

export type ScreenEventType = keyof ScreenEventMap

/**
 * All screen events that adapters typically subscribe to for re-renders.
 */
export const SCREEN_EVENTS: ScreenEventType[] = [
  'message:added',
  'message:updated',
  'messages:cleared',
  'status:changed',
  'visibility:changed',
  'badge:changed',
  'prompt:activated',
  'prompt:updated',
  'prompt:resolved',
]

/**
 * Sidebar-specific events that require re-render.
 */
export const SIDEBAR_EVENTS: ScreenManagerEventType[] = [
  'screen:added',
  'screen:removed',
  'screen:reordered',
  'sidebar:indexChanged',
  'focus:changed',
  'activeScreen:changed',
]

/**
 * Content area events that affect active screen changes.
 */
export const CONTENT_MANAGER_EVENTS: ScreenManagerEventType[] = [
  'activeScreen:changed',
  'focus:changed',
]
