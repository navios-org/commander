/**
 * Vitest setup file for commander-tui tests.
 *
 * Mocks @opentui/core and @opentui/react to avoid:
 * - .scm file loading (tree-sitter query files)
 * - WebAssembly loading (tree-sitter parsers)
 */
import { vi } from 'vitest'

// Mock @opentui/core - provides TextAttributes enum and other core types
vi.mock('@opentui/core', () => ({
  TextAttributes: {
    BOLD: 1,
    DIM: 2,
    ITALIC: 4,
    UNDERLINE: 8,
    BLINK: 16,
    REVERSE: 32,
    HIDDEN: 64,
    STRIKETHROUGH: 128,
  },
  RGBA: class RGBA {
    r: number
    g: number
    b: number
    a: number
    constructor(r = 0, g = 0, b = 0, a = 1) {
      this.r = r
      this.g = g
      this.b = b
      this.a = a
    }
    static fromHex(_hex: string) {
      return new RGBA()
    }
  },
}))

// Mock @opentui/react - provides React component rendering
vi.mock('@opentui/react', () => ({
  render: vi.fn(),
  unmount: vi.fn(),
}))
