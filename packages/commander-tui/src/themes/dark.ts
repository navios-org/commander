import type { Theme } from '../types/index.ts'

/**
 * Default dark theme.
 * Migrated from the scattered color files in utils/colors/.
 */
export const darkTheme: Theme = {
  name: 'dark',

  logLevels: {
    verbose: {
      border: '#6B7280', // Gray-500
      background: '#6B728015', // Gray with 8% opacity
    },
    debug: {
      border: '#8B5CF6', // Violet-500
      background: '#8B5CF615', // Violet with 8% opacity
    },
    log: {
      border: '#3B82F6', // Blue-500
      background: '#3B82F615', // Blue with 8% opacity
    },
    warn: {
      border: '#F59E0B', // Amber-500
      background: '#F59E0B15', // Amber with 8% opacity
    },
    error: {
      border: '#EF4444', // Red-500
      background: '#EF444415', // Red with 8% opacity
    },
    fatal: {
      border: '#DC2626', // Red-600
      background: '#DC262625', // Red with 15% opacity
      text: '#FCA5A5', // Light red text
    },
  },

  sidebar: {
    background: undefined,
    selectedBackground: '#1F293780', // Gray-800 with 50% opacity
    hoverBackground: '#374151', // Gray-700
    text: '#E5E7EB', // Gray-200
    textDim: '#6B7280', // Gray-500
    border: '#374151', // Gray-700
    badge: '#3B82F6', // Blue-500
    focusBorder: '#3B82F6', // Blue-500
  },

  header: {
    background: undefined,
    text: '#F9FAFB', // Gray-50
    border: '#374151', // Gray-700
  },

  statusIndicators: {
    waiting: {
      icon: '○',
      color: '#6B7280', // Gray-500
    },
    pending: {
      icon: '◐',
      color: '#F59E0B', // Amber-500
    },
    success: {
      icon: '✓',
      color: '#22C55E', // Green-500
    },
    fail: {
      icon: '✗',
      color: '#EF4444', // Red-500
    },
  },

  separator: {
    line: '#374151', // Gray-700
    text: '#6B7280', // Gray-500
  },

  progress: {
    border: '#3B82F6', // Blue-500
    background: '#3B82F615', // Blue with 8% opacity
    barFilled: '#3B82F6', // Blue-500
    barEmpty: '#374151', // Gray-700
    text: '#E5E7EB', // Gray-200
    textDim: '#9CA3AF', // Gray-400
    complete: '#22C55E', // Green-500
    completeBackground: '#22C55E15',
    failed: '#EF4444', // Red-500
    failedBackground: '#EF444415',
  },

  group: {
    border: '#6B7280', // Gray-500
    background: '#6B728010', // Gray with 6% opacity
    headerText: '#E5E7EB', // Gray-200
    icon: '#9CA3AF', // Gray-400
  },

  table: {
    border: '#3B82F6', // Blue-500
    background: '#3B82F615', // Blue with 8% opacity
    headerText: '#F9FAFB', // Gray-50
    cellText: '#E5E7EB', // Gray-200
    title: '#F9FAFB', // Gray-50
    separator: '#3B82F650', // Blue with 30% opacity
  },

  file: {
    border: '#3B82F6', // Blue-500
    background: '#3B82F615', // Blue with 8% opacity
    headerText: '#F9FAFB', // Gray-50
    headerBackground: '#3B82F625', // Blue with 15% opacity
  },

  prompt: {
    question: '#F9FAFB', // Gray-50
    optionText: '#E5E7EB', // Gray-200
    optionTextDim: '#9CA3AF', // Gray-400
    optionSelected: '#3B82F6', // Blue-500
    optionSelectedBackground: '#1E3A5F', // Dark blue
    confirmButton: '#22C55E', // Green-500
    cancelButton: '#EF4444', // Red-500
    buttonBackground: '#374151', // Gray-700
    buttonSelectedBackground: '#1F2937', // Gray-800
    inputBorder: '#3B82F6', // Blue-500
    inputBackground: '#1F2937', // Gray-800
    inputText: '#F9FAFB', // Gray-50
    inputPlaceholder: '#6B7280', // Gray-500
    inputCursor: '#3B82F6', // Blue-500
    border: '#374151', // Gray-700
    focusBorder: '#3B82F6', // Blue-500
  },

  errorHighlight: {
    background: '#EF444425', // Red with 15% opacity
    border: '#EF4444', // Red-500
    gutterBackground: '#EF444440', // Red with 25% opacity
  },

  filter: {
    background: '#1F293780', // Gray-800 with 50% opacity
    border: '#3B82F6', // Blue-500
    text: '#E5E7EB', // Gray-200
    textDim: '#6B7280', // Gray-500
    inputBackground: '#1F2937', // Gray-800
    inputText: '#F9FAFB', // Gray-50
    inputPlaceholder: '#6B7280', // Gray-500
    cursor: '#3B82F6', // Blue-500
    activeLevel: '#3B82F6', // Blue-500
    inactiveLevel: '#4B5563', // Gray-600
  },

  help: {
    background: '#1F2937', // Gray-800
    border: '#3B82F6', // Blue-500
    title: '#F9FAFB', // Gray-50
    category: '#3B82F6', // Blue-500
    key: '#F59E0B', // Amber-500
    description: '#E5E7EB', // Gray-200
    hint: '#6B7280', // Gray-500
  },

  colors: {
    primary: '#3B82F6', // Blue-500
    secondary: '#8B5CF6', // Violet-500
    success: '#22C55E', // Green-500
    warning: '#F59E0B', // Amber-500
    error: '#EF4444', // Red-500
    muted: '#6B7280', // Gray-500
    background: '#111827', // Gray-900
    foreground: '#F9FAFB', // Gray-50
  },
}
