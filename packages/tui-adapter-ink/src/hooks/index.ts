export { useTheme } from './use_theme.ts'
export { useFilterState, type FilterStateActions } from './use_filter_state.ts'
export {
  useKeyboardManager,
  type UseKeyboardManagerOptions,
  type UseKeyboardManagerResult,
  type KeyboardHandler,
} from './use_keyboard_manager.ts'
export { useManagerSubscription } from './use_manager_subscription.ts'
export {
  useMouseScroll,
  type MouseScrollEvent,
  type UseMouseScrollOptions,
} from './use_mouse_scroll.ts'

// New useSyncExternalStore-based hooks
export { useScreenMessages, useActivePrompt } from './use_screen_store.ts'
export {
  useActiveScreen,
  useFocusArea,
  useScreenList,
  useSidebarIndex,
} from './use_manager_store.ts'
export {
  useMessageUpdate,
  useLoadingMessageUpdate,
  useProgressMessageUpdate,
} from './use_message_update.ts'
