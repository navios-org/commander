import type { Theme } from '../types/index.ts'

/**
 * Light theme for terminals with light backgrounds.
 */
export const lightTheme: Theme = {
  name: 'light',

  logLevels: {
    verbose: {
      border: '#9CA3AF', // Gray-400
      background: '#F3F4F6', // Gray-100
    },
    debug: {
      border: '#7C3AED', // Violet-600
      background: '#EDE9FE', // Violet-100
    },
    log: {
      border: '#2563EB', // Blue-600
      background: '#DBEAFE', // Blue-100
    },
    warn: {
      border: '#D97706', // Amber-600
      background: '#FEF3C7', // Amber-100
    },
    error: {
      border: '#DC2626', // Red-600
      background: '#FEE2E2', // Red-100
    },
    fatal: {
      border: '#991B1B', // Red-800
      background: '#FECACA', // Red-200
      text: '#7F1D1D', // Red-900
    },
  },

  sidebar: {
    background: '#F9FAFB', // Gray-50
    selectedBackground: '#E5E7EB', // Gray-200
    hoverBackground: '#F3F4F6', // Gray-100
    text: '#1F2937', // Gray-800
    textDim: '#6B7280', // Gray-500
    border: '#D1D5DB', // Gray-300
    badge: '#2563EB', // Blue-600
    focusBorder: '#2563EB', // Blue-600
  },

  header: {
    background: '#F9FAFB', // Gray-50
    text: '#111827', // Gray-900
    border: '#D1D5DB', // Gray-300
  },

  statusIndicators: {
    waiting: {
      icon: '○',
      color: '#9CA3AF', // Gray-400
    },
    pending: {
      icon: '◐',
      color: '#D97706', // Amber-600
    },
    success: {
      icon: '✓',
      color: '#16A34A', // Green-600
    },
    fail: {
      icon: '✗',
      color: '#DC2626', // Red-600
    },
  },

  separator: {
    line: '#D1D5DB', // Gray-300
    text: '#6B7280', // Gray-500
  },

  progress: {
    border: '#2563EB', // Blue-600
    background: '#DBEAFE', // Blue-100
    barFilled: '#2563EB', // Blue-600
    barEmpty: '#E5E7EB', // Gray-200
    text: '#1F2937', // Gray-800
    textDim: '#6B7280', // Gray-500
    complete: '#16A34A', // Green-600
    completeBackground: '#DCFCE7', // Green-100
    failed: '#DC2626', // Red-600
    failedBackground: '#FEE2E2', // Red-100
  },

  group: {
    border: '#9CA3AF', // Gray-400
    background: '#F3F4F6', // Gray-100
    headerText: '#1F2937', // Gray-800
    icon: '#6B7280', // Gray-500
  },

  table: {
    border: '#2563EB', // Blue-600
    background: '#DBEAFE', // Blue-100
    headerText: '#111827', // Gray-900
    cellText: '#1F2937', // Gray-800
    title: '#111827', // Gray-900
    separator: '#93C5FD', // Blue-300
  },

  file: {
    border: '#2563EB', // Blue-600
    background: '#DBEAFE', // Blue-100
    headerText: '#111827', // Gray-900
    headerBackground: '#BFDBFE', // Blue-200
  },

  prompt: {
    question: '#111827', // Gray-900
    optionText: '#1F2937', // Gray-800
    optionTextDim: '#6B7280', // Gray-500
    optionSelected: '#2563EB', // Blue-600
    optionSelectedBackground: '#DBEAFE', // Blue-100
    confirmButton: '#16A34A', // Green-600
    cancelButton: '#DC2626', // Red-600
    buttonBackground: '#E5E7EB', // Gray-200
    buttonSelectedBackground: '#D1D5DB', // Gray-300
    inputBorder: '#2563EB', // Blue-600
    inputBackground: '#FFFFFF', // White
    inputText: '#111827', // Gray-900
    inputPlaceholder: '#9CA3AF', // Gray-400
    inputCursor: '#2563EB', // Blue-600
    border: '#D1D5DB', // Gray-300
    focusBorder: '#2563EB', // Blue-600
  },

  errorHighlight: {
    background: '#FEE2E2', // Red-100
    border: '#DC2626', // Red-600
    gutterBackground: '#FECACA', // Red-200
  },

  filter: {
    background: '#F3F4F6', // Gray-100
    border: '#2563EB', // Blue-600
    text: '#1F2937', // Gray-800
    textDim: '#6B7280', // Gray-500
    inputBackground: '#FFFFFF', // White
    inputText: '#111827', // Gray-900
    inputPlaceholder: '#9CA3AF', // Gray-400
    cursor: '#2563EB', // Blue-600
    activeLevel: '#2563EB', // Blue-600
    inactiveLevel: '#D1D5DB', // Gray-300
  },

  help: {
    background: '#FFFFFF', // White
    border: '#2563EB', // Blue-600
    title: '#111827', // Gray-900
    category: '#2563EB', // Blue-600
    key: '#D97706', // Amber-600
    description: '#1F2937', // Gray-800
    hint: '#6B7280', // Gray-500
  },

  colors: {
    primary: '#2563EB', // Blue-600
    secondary: '#7C3AED', // Violet-600
    success: '#16A34A', // Green-600
    warning: '#D97706', // Amber-600
    error: '#DC2626', // Red-600
    muted: '#6B7280', // Gray-500
    background: '#FFFFFF', // White
    foreground: '#111827', // Gray-900
  },
}
