/**
 * Dynamic import that bypasses bundler static analysis.
 * Uses Function constructor to prevent bundlers from resolving the import at build time.
 */
export function dynamicImport<T = unknown>(modulePath: string): Promise<T> {
  return new Function('modulePath', 'return import(modulePath)')(modulePath) as Promise<T>
}
