/**
 * React hooks over the screen manager, for adapters that render with React.
 * They know nothing about a renderer: Ink and OpenTUI share them.
 */
export { useFilterState, type FilterStateActions } from './use_filter_state.ts'
export {
  useActiveScreen,
  useFocusArea,
  useScreenList,
  useSidebarIndex,
} from './use_manager_store.ts'
export {
  useLoadingMessageUpdate,
  useMessageUpdate,
  useProgressMessageUpdate,
} from './use_message_update.ts'
export { useActivePrompt, useScreenMessages } from './use_screen_store.ts'
