import type { Theme } from '../types/index.ts'

/**
 * High contrast theme for accessibility.
 * Uses pure black/white with saturated colors for maximum visibility.
 */
export const highContrastTheme: Theme = {
  name: 'high-contrast',

  logLevels: {
    verbose: {
      border: '#FFFFFF',
      background: '#1A1A1A',
      text: '#FFFFFF',
    },
    debug: {
      border: '#A855F7', // Purple-500
      background: '#1A1A1A',
      text: '#E9D5FF', // Purple-200
    },
    log: {
      border: '#3B82F6', // Blue-500
      background: '#1A1A1A',
      text: '#BFDBFE', // Blue-200
    },
    warn: {
      border: '#FBBF24', // Amber-400
      background: '#1A1A1A',
      text: '#FEF08A', // Yellow-200
    },
    error: {
      border: '#EF4444', // Red-500
      background: '#1A1A1A',
      text: '#FECACA', // Red-200
    },
    fatal: {
      border: '#FF0000', // Pure red
      background: '#330000',
      text: '#FFFFFF',
    },
  },

  sidebar: {
    background: '#000000',
    selectedBackground: '#333333',
    hoverBackground: '#1A1A1A',
    text: '#FFFFFF',
    textDim: '#AAAAAA',
    border: '#FFFFFF',
    badge: '#FFFF00', // Yellow for high visibility
    focusBorder: '#FFFF00',
  },

  header: {
    background: '#000000',
    text: '#FFFFFF',
    border: '#FFFFFF',
  },

  statusIndicators: {
    waiting: {
      icon: '○',
      color: '#AAAAAA',
    },
    pending: {
      icon: '◐',
      color: '#FBBF24', // Amber-400
    },
    success: {
      icon: '✓',
      color: '#22C55E', // Green-500
    },
    fail: {
      icon: '✗',
      color: '#EF4444', // Red-500
    },
    static: {
      icon: '●',
      color: '#00FFFF', // Cyan for high visibility
    },
  },

  separator: {
    line: '#FFFFFF',
    text: '#AAAAAA',
  },

  progress: {
    border: '#3B82F6',
    background: '#1A1A1A',
    barFilled: '#3B82F6',
    barEmpty: '#333333',
    text: '#FFFFFF',
    textDim: '#AAAAAA',
    complete: '#22C55E',
    completeBackground: '#1A1A1A',
    failed: '#EF4444',
    failedBackground: '#1A1A1A',
  },

  group: {
    border: '#FFFFFF',
    background: '#1A1A1A',
    headerText: '#FFFFFF',
    icon: '#AAAAAA',
  },

  table: {
    border: '#FFFFFF',
    background: '#1A1A1A',
    headerText: '#FFFFFF',
    cellText: '#FFFFFF',
    title: '#FFFFFF',
    separator: '#666666',
  },

  file: {
    border: '#FFFFFF',
    background: '#1A1A1A',
    headerText: '#FFFFFF',
    headerBackground: '#333333',
  },

  prompt: {
    question: '#FFFFFF',
    optionText: '#FFFFFF',
    optionTextDim: '#AAAAAA',
    optionSelected: '#FFFF00', // Yellow for high visibility
    optionSelectedBackground: '#333333',
    confirmButton: '#22C55E',
    cancelButton: '#EF4444',
    buttonBackground: '#333333',
    buttonSelectedBackground: '#1A1A1A',
    inputBorder: '#FFFF00',
    inputBackground: '#1A1A1A',
    inputText: '#FFFFFF',
    inputPlaceholder: '#666666',
    inputCursor: '#FFFF00',
    border: '#FFFFFF',
    focusBorder: '#FFFF00',
  },

  errorHighlight: {
    background: '#330000',
    border: '#FF0000',
    gutterBackground: '#660000',
  },

  filter: {
    background: '#1A1A1A',
    border: '#FFFF00',
    text: '#FFFFFF',
    textDim: '#AAAAAA',
    inputBackground: '#000000',
    inputText: '#FFFFFF',
    inputPlaceholder: '#666666',
    cursor: '#FFFF00',
    activeLevel: '#FFFF00',
    inactiveLevel: '#666666',
  },

  help: {
    background: '#000000',
    border: '#FFFFFF',
    title: '#FFFFFF',
    category: '#FFFF00',
    key: '#00FFFF', // Cyan for contrast
    description: '#FFFFFF',
    hint: '#AAAAAA',
  },

  colors: {
    primary: '#3B82F6',
    secondary: '#A855F7',
    success: '#22C55E',
    warning: '#FBBF24',
    error: '#EF4444',
    muted: '#AAAAAA',
    background: '#000000',
    foreground: '#FFFFFF',
  },
}
