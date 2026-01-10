/**
 * Common file extension to filetype mapping for syntax highlighting.
 */
export const COMMON_FILETYPES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  css: 'css',
  html: 'html',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  toml: 'toml',
  xml: 'xml',
  sql: 'sql',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  hs: 'haskell',
  elm: 'elm',
  vue: 'vue',
  svelte: 'svelte',
}

/**
 * Resolves filetype from file path for syntax highlighting.
 *
 * @param filePath - Full file path or just filename
 * @returns Filetype string for tree-sitter, or undefined
 */
export function resolveFiletype(filePath: string): string | undefined {
  // Extract extension from path
  const lastDot = filePath.lastIndexOf('.')
  if (lastDot === -1) return undefined

  const ext = filePath.slice(lastDot + 1).toLowerCase()
  return COMMON_FILETYPES[ext]
}

/**
 * Gets the filename from a full path.
 *
 * @param filePath - Full file path
 * @returns Just the filename
 */
export function getFileName(filePath: string): string {
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return lastSlash === -1 ? filePath : filePath.slice(lastSlash + 1)
}
