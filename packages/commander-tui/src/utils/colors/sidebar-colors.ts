/**
 * Sidebar colors.
 */
export const SIDEBAR_COLORS = {
  background: undefined, // Transparent - blend with terminal
  selectedBackground: '#1F293780', // Gray-800 with 50% opacity
  hoverBackground: '#374151', // Gray-700
  text: '#E5E7EB', // Gray-200
  textDim: '#6B7280', // Gray-500
  border: '#374151', // Gray-700
  badge: '#3B82F6', // Blue-500
  focusBorder: '#3B82F6', // Blue-500
}

/**
 * Screen header colors.
 */
export const HEADER_COLORS = {
  background: undefined, // Transparent - blend with terminal
  text: '#F9FAFB', // Gray-50
  border: '#374151', // Gray-700
}

/**
 * Screen status indicator colors and icons.
 */
export const STATUS_INDICATORS = {
  waiting: {
    icon: '○', // Empty circle
    color: '#6B7280', // Gray-500
  },
  pending: {
    icon: '◐', // Half circle (spinner-like)
    color: '#F59E0B', // Amber-500
  },
  success: {
    icon: '✓', // Checkmark
    color: '#22C55E', // Green-500
  },
  fail: {
    icon: '✗', // X mark
    color: '#EF4444', // Red-500
  },
} as const

/**
 * Separator colors for sidebar sections.
 */
export const SEPARATOR_COLORS = {
  line: '#374151', // Gray-700
  text: '#6B7280', // Gray-500
}
