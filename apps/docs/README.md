# Commander documentation

The documentation site of `@navios/commander` and the terminal interface packages, built with
[Rspress](https://rspress.rs).

## Commands

Run these from the repository root.

```bash
yarn docs:dev                                        # dev server with hot reload
yarn docs:build                                      # static site in apps/docs/build
yarn workspace @navios/commander-docs preview        # serve the built site
yarn workspace @navios/commander-docs typecheck
```

## Layout

```
content/            Rspress root
  index.tsx         home page
  docs/             the pages, as markdown
  public/           static files copied to the site root
theme/              colours (brand.css) and the styles of the home page
sidebar.mts         the sidebar: which page is where
rspress.config.ts   site config
```

## Writing

- Every page has a `title` in its frontmatter. The sidebar takes its label from there, so add a new
  page to `sidebar.mts` by its path only.
- Links and anchors are checked: one that points nowhere fails the build.
- Terminal sessions are fenced as `console`, with `$ ` before what is typed.
- What the home page and the quick start show as output is asserted by
  `packages/commander/src/__tests__/docs.spec.mts`. When you change the example program or the
  output format, change the test and the pages together.

## Deployment

A push to `main` that touches `apps/docs` runs `.github/workflows/deploy-docs.yml`, which builds the
site and publishes it to GitHub Pages. The workflow passes the base path of the Pages site as
`DOCS_BASE`; locally the site is served from `/`.
