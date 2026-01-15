/**
 * Detect if running in Bun environment (OpenTUI is not supported in Bun)
 */
export function isBunRuntime(): boolean {
  return typeof (globalThis as Record<string, unknown>).Bun !== 'undefined'
}

/**
 * Dynamic import that bypasses bundler static analysis.
 * Uses Function constructor to prevent bundlers from resolving the import at build time.
 */
export function dynamicImport<T = unknown>(modulePath: string): Promise<T> {
  return new Function('modulePath', 'return import(modulePath)')(modulePath) as Promise<T>
}
