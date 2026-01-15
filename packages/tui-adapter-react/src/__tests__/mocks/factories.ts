import { mock } from 'bun:test'

import type { LogLevel } from '@navios/core'
import type {
  ChoicePromptData,
  ConfirmPromptData,
  DiffMessageData,
  FileErrorMessageData,
  FileMessageData,
  FilterState,
  GroupMessageData,
  InputPromptData,
  KeyboardContext,
  LoadingMessageData,
  LogMessageData,
  MultiChoicePromptData,
  ProgressMessageData,
  ScreenInstance,
  ScreenManagerInstance,
  TableMessageData,
  Theme,
} from '@navios/commander-tui'
import { darkTheme } from '@navios/commander-tui'

let idCounter = 0

function generateId(prefix = 'test'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Fixed timestamp for snapshot tests.
 * Using a stable date ensures snapshots don't change between runs.
 */
export const STABLE_TIMESTAMP = new Date('2025-01-01T00:00:00.000Z')

// ============================================
// Message Factories
// ============================================

export function createLogMessage(overrides: Partial<LogMessageData> = {}): LogMessageData {
  return {
    id: generateId('log'),
    type: 'log',
    timestamp: STABLE_TIMESTAMP,
    level: 'log',
    content: 'Test log message',
    ...overrides,
  }
}

export function createFileMessage(overrides: Partial<FileMessageData> = {}): FileMessageData {
  return {
    id: generateId('file'),
    type: 'file',
    timestamp: STABLE_TIMESTAMP,
    filePath: '/test/file.ts',
    content: 'const x = 1;',
    ...overrides,
  }
}

export function createDiffMessage(overrides: Partial<DiffMessageData> = {}): DiffMessageData {
  return {
    id: generateId('diff'),
    type: 'diff',
    timestamp: STABLE_TIMESTAMP,
    filePath: '/test/file.ts',
    diff: '- old\n+ new',
    ...overrides,
  }
}

export function createFileErrorMessage(
  overrides: Partial<FileErrorMessageData> = {},
): FileErrorMessageData {
  return {
    id: generateId('fileError'),
    type: 'fileError',
    timestamp: STABLE_TIMESTAMP,
    filePath: '/test/file.ts',
    content: 'const x = 1;',
    errorLines: [1],
    startLine: 1,
    ...overrides,
  }
}

export function createLoadingMessage(
  overrides: Partial<LoadingMessageData> = {},
): LoadingMessageData {
  return {
    id: generateId('loading'),
    type: 'loading',
    timestamp: STABLE_TIMESTAMP,
    content: 'Loading...',
    status: 'loading',
    ...overrides,
  }
}

export function createProgressMessage(
  overrides: Partial<ProgressMessageData> = {},
): ProgressMessageData {
  return {
    id: generateId('progress'),
    type: 'progress',
    timestamp: STABLE_TIMESTAMP,
    label: 'Processing',
    current: 0,
    total: 100,
    status: 'active',
    ...overrides,
  }
}

export function createGroupMessage(overrides: Partial<GroupMessageData> = {}): GroupMessageData {
  return {
    id: generateId('group'),
    type: 'group',
    timestamp: STABLE_TIMESTAMP,
    label: 'Test Group',
    collapsed: false,
    isEnd: false,
    ...overrides,
  }
}

export function createTableMessage(overrides: Partial<TableMessageData> = {}): TableMessageData {
  return {
    id: generateId('table'),
    type: 'table',
    timestamp: STABLE_TIMESTAMP,
    headers: ['Name', 'Value'],
    rows: [
      ['foo', '1'],
      ['bar', '2'],
    ],
    ...overrides,
  }
}

// ============================================
// Prompt Factories
// ============================================

export function createChoicePrompt(overrides: Partial<ChoicePromptData> = {}): ChoicePromptData {
  return {
    id: generateId('prompt'),
    type: 'choice',
    timestamp: STABLE_TIMESTAMP,
    question: 'Select an option',
    choices: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
      { label: 'Option C', value: 'c' },
    ],
    defaultChoice: 'a',
    selectedIndex: 0,
    inputMode: false,
    inputValue: '',
    resolved: false,
    ...overrides,
  }
}

export function createConfirmPrompt(overrides: Partial<ConfirmPromptData> = {}): ConfirmPromptData {
  return {
    id: generateId('prompt'),
    type: 'confirm',
    timestamp: STABLE_TIMESTAMP,
    question: 'Are you sure?',
    confirmText: 'Yes',
    cancelText: 'No',
    defaultValue: true,
    selectedValue: true,
    resolved: false,
    ...overrides,
  }
}

export function createInputPrompt(overrides: Partial<InputPromptData> = {}): InputPromptData {
  return {
    id: generateId('prompt'),
    type: 'input',
    timestamp: STABLE_TIMESTAMP,
    question: 'Enter a value',
    placeholder: 'Type here...',
    defaultValue: '',
    value: '',
    resolved: false,
    ...overrides,
  }
}

export function createMultiChoicePrompt(
  overrides: Partial<MultiChoicePromptData> = {},
): MultiChoicePromptData {
  return {
    id: generateId('prompt'),
    type: 'multiChoice',
    timestamp: STABLE_TIMESTAMP,
    question: 'Select options',
    choices: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
      { label: 'Option C', value: 'c' },
    ],
    selectedIndices: new Set(),
    focusedIndex: 0,
    minSelect: 0,
    maxSelect: 3,
    resolved: false,
    ...overrides,
  }
}

// ============================================
// Filter & Keyboard Factories
// ============================================

const ALL_LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']

export function createFilterState(overrides: Partial<FilterState> = {}): FilterState {
  return {
    enabledLevels: new Set(ALL_LOG_LEVELS),
    searchQuery: '',
    isVisible: false,
    focusedField: 'search',
    ...overrides,
  }
}

export function createKeyboardContext(overrides: Partial<KeyboardContext> = {}): KeyboardContext {
  return {
    hasPrompt: false,
    inInputMode: false,
    focusArea: 'content',
    isFilterActive: false,
    isHelpVisible: false,
    hasSidebar: true,
    ...overrides,
  }
}

// ============================================
// Theme Factory
// ============================================

export function createTheme(): Theme {
  return { ...darkTheme }
}

// ============================================
// Mock Screen Instance
// ============================================

export interface MockScreenInstance {
  getId: ReturnType<typeof mock>
  getName: ReturnType<typeof mock>
  getIcon: ReturnType<typeof mock>
  getBadgeCount: ReturnType<typeof mock>
  setBadgeCount: ReturnType<typeof mock>
  isHidden: ReturnType<typeof mock>
  setHidden: ReturnType<typeof mock>
  show: ReturnType<typeof mock>
  hide: ReturnType<typeof mock>
  getStatus: ReturnType<typeof mock>
  setStatus: ReturnType<typeof mock>
  isComplete: ReturnType<typeof mock>
  hasPrintedToConsole: ReturnType<typeof mock>
  isLogLevelEnabled: ReturnType<typeof mock>
  getMessages: ReturnType<typeof mock>
  addMessage: ReturnType<typeof mock>
  updateMessage: ReturnType<typeof mock>
  updateProgressMessage: ReturnType<typeof mock>
  clear: ReturnType<typeof mock>
  _addPrompt: ReturnType<typeof mock>
  getActivePrompt: ReturnType<typeof mock>
  hasActivePrompt: ReturnType<typeof mock>
  updatePromptSelection: ReturnType<typeof mock>
  promptNavigateUp: ReturnType<typeof mock>
  promptNavigateDown: ReturnType<typeof mock>
  promptNavigateLeft: ReturnType<typeof mock>
  promptNavigateRight: ReturnType<typeof mock>
  promptToggleSelection: ReturnType<typeof mock>
  promptEnterInputMode: ReturnType<typeof mock>
  promptExitInputMode: ReturnType<typeof mock>
  isPromptInInputMode: ReturnType<typeof mock>
  promptUpdateInput: ReturnType<typeof mock>
  promptAppendInput: ReturnType<typeof mock>
  promptDeleteLastChar: ReturnType<typeof mock>
  canSubmitPrompt: ReturnType<typeof mock>
  promptSubmit: ReturnType<typeof mock>
  on: ReturnType<typeof mock>
  off: ReturnType<typeof mock>
  _setManager: ReturnType<typeof mock>
  _setPrintFn: ReturnType<typeof mock>
  _flushToConsole: ReturnType<typeof mock>
}

export function createMockScreenInstance(
  overrides: Partial<Record<string, unknown>> = {},
): MockScreenInstance {
  const self = {} as MockScreenInstance

  const mockScreen: MockScreenInstance = {
    getId: mock(() => 'test-screen-id'),
    getName: mock(() => 'Test Screen'),
    getIcon: mock(() => undefined),
    getBadgeCount: mock(() => 0),
    setBadgeCount: mock(() => self),
    isHidden: mock(() => false),
    setHidden: mock(() => self),
    show: mock(() => self),
    hide: mock(() => self),
    getStatus: mock(() => 'pending'),
    setStatus: mock(() => self),
    isComplete: mock(() => false),
    hasPrintedToConsole: mock(() => false),
    isLogLevelEnabled: mock(() => true),
    getMessages: mock(() => []),
    addMessage: mock(() => {}),
    updateMessage: mock(() => {}),
    updateProgressMessage: mock(() => {}),
    clear: mock(() => self),
    _addPrompt: mock(() => Promise.resolve('')),
    getActivePrompt: mock(() => null),
    hasActivePrompt: mock(() => false),
    updatePromptSelection: mock(() => {}),
    promptNavigateUp: mock(() => {}),
    promptNavigateDown: mock(() => {}),
    promptNavigateLeft: mock(() => {}),
    promptNavigateRight: mock(() => {}),
    promptToggleSelection: mock(() => {}),
    promptEnterInputMode: mock(() => false),
    promptExitInputMode: mock(() => {}),
    isPromptInInputMode: mock(() => false),
    promptUpdateInput: mock(() => {}),
    promptAppendInput: mock(() => {}),
    promptDeleteLastChar: mock(() => {}),
    canSubmitPrompt: mock(() => true),
    promptSubmit: mock(() => {}),
    on: mock(() => {}),
    off: mock(() => {}),
    _setManager: mock(() => {}),
    _setPrintFn: mock(() => {}),
    _flushToConsole: mock(() => {}),
    ...overrides,
  }

  // Update self reference for chainable methods
  Object.assign(self, mockScreen)

  return mockScreen
}

// ============================================
// Mock Screen Manager Instance
// ============================================

export interface MockScreenManagerInstance {
  getScreens: ReturnType<typeof mock>
  getActiveScreen: ReturnType<typeof mock>
  setActiveScreen: ReturnType<typeof mock>
  focusArea: 'sidebar' | 'content'
  getBindOptions: ReturnType<typeof mock>
  on: ReturnType<typeof mock>
  off: ReturnType<typeof mock>
  onScreenCompleted: ReturnType<typeof mock>
  onScreenVisibilityChanged: ReturnType<typeof mock>
  onScreenPromptActivated: ReturnType<typeof mock>
  getRenderMode: ReturnType<typeof mock>
  hasTuiRenderer: ReturnType<typeof mock>
  isInteractive: ReturnType<typeof mock>
  handleReadlinePrompt: ReturnType<typeof mock>
  isTuiBound: ReturnType<typeof mock>
  isOpenTUIActive: ReturnType<typeof mock>
  sidebarIndex: number
  setSidebarIndex: ReturnType<typeof mock>
  moveSidebarUp: ReturnType<typeof mock>
  moveSidebarDown: ReturnType<typeof mock>
  selectSidebarItem: ReturnType<typeof mock>
  setFocusArea: ReturnType<typeof mock>
  toggleFocus: ReturnType<typeof mock>
}

export function createMockScreenManagerInstance(
  overrides: Partial<Record<string, unknown>> = {},
): MockScreenManagerInstance {
  const mockManager: MockScreenManagerInstance = {
    getScreens: mock(() => []),
    getActiveScreen: mock(() => null),
    setActiveScreen: mock(() => {}),
    focusArea: 'content',
    getBindOptions: mock(() => ({ sidebarWidth: 25, sidebarTitle: 'Screens' })),
    on: mock(() => {}),
    off: mock(() => {}),
    onScreenCompleted: mock(() => {}),
    onScreenVisibilityChanged: mock(() => {}),
    onScreenPromptActivated: mock(() => {}),
    getRenderMode: mock(() => 2), // RenderMode.TUI_ACTIVE
    hasTuiRenderer: mock(() => true),
    isInteractive: mock(() => true),
    handleReadlinePrompt: mock(() => {}),
    isTuiBound: mock(() => true),
    isOpenTUIActive: mock(() => true),
    sidebarIndex: 0,
    setSidebarIndex: mock(() => {}),
    moveSidebarUp: mock(() => {}),
    moveSidebarDown: mock(() => {}),
    selectSidebarItem: mock(() => {}),
    setFocusArea: mock(() => {}),
    toggleFocus: mock(() => {}),
    ...overrides,
  }

  return mockManager
}

// ============================================
// Reset ID Counter (for test isolation)
// ============================================

export function resetIdCounter(): void {
  idCounter = 0
}

// Type helpers for casting mocks to actual types
export function asMockScreen(mock: MockScreenInstance): ScreenInstance {
  return mock as unknown as ScreenInstance
}

export function asMockManager(mock: MockScreenManagerInstance): ScreenManagerInstance {
  return mock as unknown as ScreenManagerInstance
}
