import { vi } from 'vitest'

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
  getId: ReturnType<typeof vi.fn>
  getName: ReturnType<typeof vi.fn>
  getIcon: ReturnType<typeof vi.fn>
  getBadgeCount: ReturnType<typeof vi.fn>
  setBadgeCount: ReturnType<typeof vi.fn>
  isHidden: ReturnType<typeof vi.fn>
  setHidden: ReturnType<typeof vi.fn>
  show: ReturnType<typeof vi.fn>
  hide: ReturnType<typeof vi.fn>
  getStatus: ReturnType<typeof vi.fn>
  setStatus: ReturnType<typeof vi.fn>
  isComplete: ReturnType<typeof vi.fn>
  hasPrintedToConsole: ReturnType<typeof vi.fn>
  isLogLevelEnabled: ReturnType<typeof vi.fn>
  getMessages: ReturnType<typeof vi.fn>
  addMessage: ReturnType<typeof vi.fn>
  updateMessage: ReturnType<typeof vi.fn>
  updateProgressMessage: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
  _addPrompt: ReturnType<typeof vi.fn>
  getActivePrompt: ReturnType<typeof vi.fn>
  hasActivePrompt: ReturnType<typeof vi.fn>
  updatePromptSelection: ReturnType<typeof vi.fn>
  promptNavigateUp: ReturnType<typeof vi.fn>
  promptNavigateDown: ReturnType<typeof vi.fn>
  promptNavigateLeft: ReturnType<typeof vi.fn>
  promptNavigateRight: ReturnType<typeof vi.fn>
  promptToggleSelection: ReturnType<typeof vi.fn>
  promptEnterInputMode: ReturnType<typeof vi.fn>
  promptExitInputMode: ReturnType<typeof vi.fn>
  isPromptInInputMode: ReturnType<typeof vi.fn>
  promptUpdateInput: ReturnType<typeof vi.fn>
  promptAppendInput: ReturnType<typeof vi.fn>
  promptDeleteLastChar: ReturnType<typeof vi.fn>
  canSubmitPrompt: ReturnType<typeof vi.fn>
  promptSubmit: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  _setManager: ReturnType<typeof vi.fn>
  _setPrintFn: ReturnType<typeof vi.fn>
  _flushToConsole: ReturnType<typeof vi.fn>
}

export function createMockScreenInstance(
  overrides: Partial<MockScreenInstance> = {},
): MockScreenInstance {
  const mockScreen: MockScreenInstance = {
    getId: vi.fn(() => 'test-screen-id'),
    getName: vi.fn(() => 'Test Screen'),
    getIcon: vi.fn(() => undefined),
    getBadgeCount: vi.fn(() => 0),
    setBadgeCount: vi.fn().mockReturnThis(),
    isHidden: vi.fn(() => false),
    setHidden: vi.fn().mockReturnThis(),
    show: vi.fn().mockReturnThis(),
    hide: vi.fn().mockReturnThis(),
    getStatus: vi.fn(() => 'pending'),
    setStatus: vi.fn().mockReturnThis(),
    isComplete: vi.fn(() => false),
    hasPrintedToConsole: vi.fn(() => false),
    isLogLevelEnabled: vi.fn(() => true),
    getMessages: vi.fn(() => []),
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
    updateProgressMessage: vi.fn(),
    clear: vi.fn().mockReturnThis(),
    _addPrompt: vi.fn(() => Promise.resolve('')),
    getActivePrompt: vi.fn(() => null),
    hasActivePrompt: vi.fn(() => false),
    updatePromptSelection: vi.fn(),
    promptNavigateUp: vi.fn(),
    promptNavigateDown: vi.fn(),
    promptNavigateLeft: vi.fn(),
    promptNavigateRight: vi.fn(),
    promptToggleSelection: vi.fn(),
    promptEnterInputMode: vi.fn(() => false),
    promptExitInputMode: vi.fn(),
    isPromptInInputMode: vi.fn(() => false),
    promptUpdateInput: vi.fn(),
    promptAppendInput: vi.fn(),
    promptDeleteLastChar: vi.fn(),
    canSubmitPrompt: vi.fn(() => true),
    promptSubmit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    _setManager: vi.fn(),
    _setPrintFn: vi.fn(),
    _flushToConsole: vi.fn(),
    ...overrides,
  }

  return mockScreen
}

// ============================================
// Mock Screen Manager Instance
// ============================================

export interface MockScreenManagerInstance {
  getScreens: ReturnType<typeof vi.fn>
  getActiveScreen: ReturnType<typeof vi.fn>
  setActiveScreen: ReturnType<typeof vi.fn>
  focusArea: 'sidebar' | 'content'
  getBindOptions: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  onScreenCompleted: ReturnType<typeof vi.fn>
  onScreenVisibilityChanged: ReturnType<typeof vi.fn>
  onScreenPromptActivated: ReturnType<typeof vi.fn>
  getRenderMode: ReturnType<typeof vi.fn>
  hasTuiRenderer: ReturnType<typeof vi.fn>
  isInteractive: ReturnType<typeof vi.fn>
  handleReadlinePrompt: ReturnType<typeof vi.fn>
  isTuiBound: ReturnType<typeof vi.fn>
  isOpenTUIActive: ReturnType<typeof vi.fn>
  sidebarIndex: number
  setSidebarIndex: ReturnType<typeof vi.fn>
  moveSidebarUp: ReturnType<typeof vi.fn>
  moveSidebarDown: ReturnType<typeof vi.fn>
  selectSidebarItem: ReturnType<typeof vi.fn>
  setFocusArea: ReturnType<typeof vi.fn>
}

export function createMockScreenManagerInstance(
  overrides: Partial<MockScreenManagerInstance> = {},
): MockScreenManagerInstance {
  const mockManager: MockScreenManagerInstance = {
    getScreens: vi.fn(() => []),
    getActiveScreen: vi.fn(() => null),
    setActiveScreen: vi.fn(),
    focusArea: 'content',
    getBindOptions: vi.fn(() => ({ sidebarWidth: 25, sidebarTitle: 'Screens' })),
    on: vi.fn(),
    off: vi.fn(),
    onScreenCompleted: vi.fn(),
    onScreenVisibilityChanged: vi.fn(),
    onScreenPromptActivated: vi.fn(),
    getRenderMode: vi.fn(() => 2), // RenderMode.TUI_ACTIVE
    hasTuiRenderer: vi.fn(() => true),
    isInteractive: vi.fn(() => true),
    handleReadlinePrompt: vi.fn(),
    isTuiBound: vi.fn(() => true),
    isOpenTUIActive: vi.fn(() => true),
    sidebarIndex: 0,
    setSidebarIndex: vi.fn(),
    moveSidebarUp: vi.fn(),
    moveSidebarDown: vi.fn(),
    selectSidebarItem: vi.fn(),
    setFocusArea: vi.fn(),
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
