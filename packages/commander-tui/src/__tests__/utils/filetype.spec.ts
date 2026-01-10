import { describe, expect, it } from 'vitest'

import { COMMON_FILETYPES, getFileName, resolveFiletype } from '../../utils/filetype.ts'

describe('resolveFiletype', () => {
  describe('common extensions', () => {
    it('should resolve TypeScript files', () => {
      expect(resolveFiletype('file.ts')).toBe('typescript')
      expect(resolveFiletype('file.tsx')).toBe('tsx')
    })

    it('should resolve JavaScript files', () => {
      expect(resolveFiletype('file.js')).toBe('javascript')
      expect(resolveFiletype('file.jsx')).toBe('javascript')
    })

    it('should resolve Python files', () => {
      expect(resolveFiletype('file.py')).toBe('python')
    })

    it('should resolve Rust files', () => {
      expect(resolveFiletype('file.rs')).toBe('rust')
    })

    it('should resolve Go files', () => {
      expect(resolveFiletype('file.go')).toBe('go')
    })

    it('should resolve JSON files', () => {
      expect(resolveFiletype('file.json')).toBe('json')
    })

    it('should resolve Markdown files', () => {
      expect(resolveFiletype('file.md')).toBe('markdown')
    })

    it('should resolve YAML files (both extensions)', () => {
      expect(resolveFiletype('file.yaml')).toBe('yaml')
      expect(resolveFiletype('file.yml')).toBe('yaml')
    })

    it('should resolve shell scripts', () => {
      expect(resolveFiletype('file.sh')).toBe('bash')
      expect(resolveFiletype('file.bash')).toBe('bash')
      expect(resolveFiletype('file.zsh')).toBe('bash')
    })

    it('should resolve C/C++ files', () => {
      expect(resolveFiletype('file.c')).toBe('c')
      expect(resolveFiletype('file.h')).toBe('c')
      expect(resolveFiletype('file.cpp')).toBe('cpp')
      expect(resolveFiletype('file.hpp')).toBe('cpp')
    })

    it('should resolve web files', () => {
      expect(resolveFiletype('file.html')).toBe('html')
      expect(resolveFiletype('file.css')).toBe('css')
      expect(resolveFiletype('file.xml')).toBe('xml')
    })

    it('should resolve other common languages', () => {
      expect(resolveFiletype('file.java')).toBe('java')
      expect(resolveFiletype('file.rb')).toBe('ruby')
      expect(resolveFiletype('file.php')).toBe('php')
      expect(resolveFiletype('file.swift')).toBe('swift')
      expect(resolveFiletype('file.kt')).toBe('kotlin')
      expect(resolveFiletype('file.scala')).toBe('scala')
      expect(resolveFiletype('file.hs')).toBe('haskell')
      expect(resolveFiletype('file.sql')).toBe('sql')
      expect(resolveFiletype('file.toml')).toBe('toml')
    })

    it('should resolve frontend framework files', () => {
      expect(resolveFiletype('file.vue')).toBe('vue')
      expect(resolveFiletype('file.svelte')).toBe('svelte')
      expect(resolveFiletype('file.elm')).toBe('elm')
    })
  })

  describe('edge cases', () => {
    it('should return undefined for unknown extensions', () => {
      expect(resolveFiletype('file.xyz')).toBeUndefined()
      expect(resolveFiletype('file.unknown')).toBeUndefined()
    })

    it('should return undefined for files without extension', () => {
      expect(resolveFiletype('Makefile')).toBeUndefined()
      expect(resolveFiletype('Dockerfile')).toBeUndefined()
      expect(resolveFiletype('README')).toBeUndefined()
    })

    it('should handle lowercase extensions (case-insensitive)', () => {
      // The function extracts and lowercases the extension
      expect(resolveFiletype('file.TS')).toBe('typescript')
      expect(resolveFiletype('file.JS')).toBe('javascript')
      expect(resolveFiletype('file.PY')).toBe('python')
    })

    it('should handle full paths, not just filenames', () => {
      expect(resolveFiletype('/home/user/project/src/index.ts')).toBe('typescript')
      expect(resolveFiletype('C:\\Users\\project\\src\\main.py')).toBe('python')
      expect(resolveFiletype('./relative/path/file.json')).toBe('json')
    })

    it('should handle files with multiple dots', () => {
      expect(resolveFiletype('file.test.ts')).toBe('typescript')
      expect(resolveFiletype('file.spec.tsx')).toBe('tsx')
      expect(resolveFiletype('app.config.json')).toBe('json')
    })

    it('should handle hidden files with extensions', () => {
      expect(resolveFiletype('.eslintrc.json')).toBe('json')
      expect(resolveFiletype('.gitignore.bak')).toBeUndefined()
    })
  })

  describe('COMMON_FILETYPES mapping', () => {
    it('should have all expected extensions mapped', () => {
      const expectedMappings: Record<string, string> = {
        ts: 'typescript',
        tsx: 'tsx',
        js: 'javascript',
        jsx: 'javascript',
        json: 'json',
        md: 'markdown',
        py: 'python',
        rs: 'rust',
        go: 'go',
      }

      for (const [ext, type] of Object.entries(expectedMappings)) {
        expect(COMMON_FILETYPES[ext]).toBe(type)
      }
    })
  })
})

describe('getFileName', () => {
  describe('Unix paths', () => {
    it('should extract filename from Unix absolute path', () => {
      expect(getFileName('/home/user/project/file.ts')).toBe('file.ts')
    })

    it('should extract filename from Unix relative path', () => {
      expect(getFileName('./src/utils/helper.ts')).toBe('helper.ts')
      expect(getFileName('../config/settings.json')).toBe('settings.json')
    })

    it('should handle deep paths', () => {
      expect(getFileName('/a/b/c/d/e/f/file.txt')).toBe('file.txt')
    })
  })

  describe('Windows paths', () => {
    it('should extract filename from Windows absolute path', () => {
      expect(getFileName('C:\\Users\\project\\file.ts')).toBe('file.ts')
    })

    it('should extract filename from Windows relative path', () => {
      expect(getFileName('.\\src\\utils\\helper.ts')).toBe('helper.ts')
    })

    it('should handle mixed separators', () => {
      // This could happen in some edge cases
      expect(getFileName('/path/to\\file.ts')).toBe('file.ts')
    })
  })

  describe('edge cases', () => {
    it('should return original string if no slashes', () => {
      expect(getFileName('file.ts')).toBe('file.ts')
      expect(getFileName('README.md')).toBe('README.md')
    })

    it('should handle trailing slashes (returns empty string)', () => {
      // lastIndexOf finds the trailing slash, slice returns empty
      expect(getFileName('/path/to/directory/')).toBe('')
      expect(getFileName('C:\\Users\\folder\\')).toBe('')
    })

    it('should handle root paths', () => {
      expect(getFileName('/file.ts')).toBe('file.ts')
    })

    it('should handle files without extensions', () => {
      expect(getFileName('/path/to/Makefile')).toBe('Makefile')
      expect(getFileName('/path/to/Dockerfile')).toBe('Dockerfile')
    })

    it('should handle hidden files', () => {
      expect(getFileName('/path/to/.gitignore')).toBe('.gitignore')
      expect(getFileName('/path/to/.env')).toBe('.env')
    })
  })
})
