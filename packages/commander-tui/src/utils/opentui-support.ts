import { dynamicImport, isBunRuntime } from './runtime.ts'

/** Lowest Node.js release supported by `@opentui/core` (its `engines` field). */
export const OPENTUI_MIN_NODE_VERSION = '26.4.0'

/**
 * Compare dotted `major.minor.patch` versions (pre-release suffixes ignored).
 */
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
 * Whether the OpenTUI renderer can run in this process: always under Bun, and
 * under Node.js 26.4+ when `node:ffi` is available (it requires starting Node
 * with `--experimental-ffi`).
 */
export async function isOpenTUISupported(
  nodeVersion: string = process.versions.node,
): Promise<boolean> {
  if (isBunRuntime()) return true
  if (!isNodeVersionAtLeast(nodeVersion, OPENTUI_MIN_NODE_VERSION)) return false
  return dynamicImport('node:ffi').then(
    () => true,
    () => false,
  )
}
