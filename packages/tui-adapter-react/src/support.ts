export const OPENTUI_MIN_NODE_VERSION = '26.4.0'

export function isNodeVersionAtLeast(version: string, minimum: string): boolean {
  const parse = (v: string) => v.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const actual = parse(version)
  const required = parse(minimum)
  for (let i = 0; i < required.length; i++) {
    const a = actual[i] ?? 0
    const r = required[i] ?? 0
    if (a !== r) return a > r
  }
  return true
}

/**
 * Whether OpenTUI can run in this process: `true`, or the reason why not.
 * It needs Bun, or the FFI of Node.js 26.4+ (`--experimental-ffi`).
 */
export async function openTuiSupport(
  nodeVersion: string = process.versions.node,
): Promise<true | string> {
  if (typeof (globalThis as Record<string, unknown>).Bun !== 'undefined') {
    return true
  }
  if (!isNodeVersionAtLeast(nodeVersion, OPENTUI_MIN_NODE_VERSION)) {
    return `OpenTUI needs Bun or Node.js ${OPENTUI_MIN_NODE_VERSION}+, and this is Node.js ${nodeVersion}`
  }
  // A string the bundler cannot see through: `node:ffi` does not exist everywhere.
  const ffi = 'node:ffi'
  return import(ffi).then(
    () => true as const,
    () => 'OpenTUI needs Node.js to be started with --experimental-ffi',
  )
}
