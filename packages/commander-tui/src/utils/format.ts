/**
 * Format an object for display with configurable depth
 */
export function formatObject(obj: unknown, depth: number = 2, currentDepth: number = 0): string {
  if (currentDepth >= depth) {
    if (Array.isArray(obj)) return '[Array]'
    if (typeof obj === 'object' && obj !== null) {
      const constructorName = obj.constructor?.name ?? 'Object'
      return `[${constructorName}]`
    }
    return String(obj)
  }

  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (typeof obj === 'string') return `"${obj}"`
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
  if (typeof obj === 'function') return '[Function]'
  if (obj instanceof Date) return obj.toISOString()
  if (obj instanceof Error) return `${obj.name}: ${obj.message}`

  const indent = '  '.repeat(currentDepth)
  const childIndent = '  '.repeat(currentDepth + 1)

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map((item) => formatObject(item, depth, currentDepth + 1))
    return `[\n${childIndent}${items.join(`,\n${childIndent}`)}\n${indent}]`
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (entries.length === 0) return '{}'
    const pairs = entries.map(
      ([key, value]) => `${key}: ${formatObject(value, depth, currentDepth + 1)}`,
    )
    return `{\n${childIndent}${pairs.join(`,\n${childIndent}`)}\n${indent}}`
  }

  return String(obj)
}

/**
 * Capture a stack trace, filtering out internal frames
 */
export function captureTrace(): string {
  const err = new Error()
  const stack = err.stack ?? ''
  const lines = stack.split('\n')
  // Skip the first 4 lines: Error, captureTrace, trace method, and the log method
  return lines.slice(4).join('\n')
}
