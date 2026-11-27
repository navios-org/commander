/**
 * The sidebar of the documentation.
 *
 * An entry is the path of a page below `content/docs`, without its extension. Its label is the
 * `title` of the page's frontmatter, so a page is named in one place only.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Section {
  text: string
  pages: string[]
}

const docsDir = join(import.meta.dirname, 'content/docs')

function title(page: string): string {
  const base = join(docsDir, page)
  const file = [`${base}.md`, `${base}.mdx`, join(base, 'index.md')].find((candidate) =>
    existsSync(candidate),
  )
  if (!file) {
    throw new Error(`sidebar.mts: there is no page "${page}"`)
  }
  const found = readFileSync(file, 'utf8').match(/^---\n[\s\S]*?^title:\s*(.+)$[\s\S]*?\n---/m)
  if (!found) {
    throw new Error(`sidebar.mts: "${page}" has no title in its frontmatter`)
  }
  return found[1].replace(/^['"]|['"]$/g, '')
}

const sections: Section[] = [
  {
    text: 'Start here',
    pages: ['index', 'quick-start'],
  },
  {
    text: 'Essentials',
    pages: [
      'essentials/commands',
      'essentials/arguments-and-options',
      'essentials/help-and-errors',
      'essentials/services-and-modules',
      'essentials/running',
    ],
  },
  {
    text: 'Guides',
    pages: [
      'guides/testing',
      'guides/guards-and-interceptors',
      'guides/lazy-commands',
      'guides/output-and-logging',
      'guides/legacy-decorators',
    ],
  },
  {
    text: 'Terminal interface',
    pages: ['tui/index', 'tui/screens-and-logs', 'tui/prompts', 'tui/adapters'],
  },
  {
    text: 'Reference',
    pages: ['reference/api', 'reference/migrating-to-2'],
  },
]

export const sidebar = {
  '/docs/': sections.map((section) => ({
    text: section.text,
    collapsible: false,
    items: section.pages.map((page) => ({
      text: title(page),
      link: `/docs/${page.replace(/(^|\/)index$/, '$1')}`,
    })),
  })),
}
