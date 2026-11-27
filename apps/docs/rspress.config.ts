import { join } from 'node:path'

import { defineConfig } from '@rspress/core'

import { sidebar } from './sidebar.mts'

// GitHub Pages serves a project site below the name of the repository. Set
// DOCS_BASE to `/` when the site gets a domain of its own.
const base = process.env.DOCS_BASE ?? '/'

export default defineConfig({
  root: 'content',
  outDir: 'build',
  base,
  title: 'Navios Commander',
  description: 'Command line applications with decorators, dependency injection and typed options',
  icon: '/img/favicon.ico',
  logo: '/img/logo.svg',
  logoText: 'Commander',
  globalStyles: join(import.meta.dirname, 'theme/brand.css'),
  markdown: {
    // A broken link or anchor fails the build.
    link: { checkDeadLinks: true, checkAnchors: true },
    showLineNumbers: false,
  },
  themeConfig: {
    darkMode: 'dark',
    nav: [
      { text: 'Guide', link: '/docs/', activeMatch: '^/docs/(?!tui|reference)' },
      { text: 'Terminal interface', link: '/docs/tui/', activeMatch: '^/docs/tui/' },
      { text: 'API', link: '/docs/reference/api', activeMatch: '^/docs/reference/' },
      { text: 'Navios', link: 'https://navios.tech' },
    ],
    sidebar,
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/navios-org/commander' },
    ],
    editLink: {
      docRepoBaseUrl: 'https://github.com/navios-org/commander/tree/main/apps/docs/content',
    },
    footer: { message: 'MIT licensed. Part of the Navios framework.' },
  },
})
