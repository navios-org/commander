import { Link } from '@rspress/core/theme'
import { useState } from 'react'

import type { ReactNode } from 'react'

import styles from '../theme/home.module.css'

const installCommand = 'npm install @navios/commander@next @navios/core@next zod'

interface Session {
  tab: string
  lines: ReactNode
}

function Line({ command }: { command: string }) {
  return (
    <>
      <span className={styles.prompt}>$ </span>
      {command}
      {'\n'}
    </>
  )
}

// What the program of the quick start prints, as asserted by
// packages/commander/src/__tests__/docs.spec.mts. Change both together.
const sessions: Session[] = [
  {
    tab: 'run',
    lines: (
      <>
        <Line command="mycli deploy production --dry-run" />
        {'Would deploy to production\n\n'}
        <Line command="mycli deploy staging -n --tag v2 --tag canary" />
        {'Would deploy to staging (v2, canary)\n\n'}
        <Line command="echo $?" />
        {'0\n'}
      </>
    ),
  },
  {
    tab: '--help',
    lines: (
      <>
        <Line command="mycli deploy --help" />
        {`Usage: mycli deploy <env> [options]

Deploy the application

Arguments:
  <env>  (staging | production)

Options:
  -n, --dry-run          Change nothing
      --tag <string...>  Tags to deploy (repeatable)
  -h, --help             Show help

Examples:
  mycli deploy production --dry-run
`}
      </>
    ),
  },
  {
    tab: 'typos',
    lines: (
      <>
        <Line command="mycli deploy production --dry-rnu" />
        <span className={styles.bad}>mycli: Unknown option --dry-rnu. Did you mean --dry-run?</span>
        {'\n'}
        <span className={styles.dim}>Run "mycli deploy --help" for usage.</span>
        {'\n\n'}
        <Line command="mycli deploy nowhere" />
        <span className={styles.bad}>
          {'mycli: <env>: Invalid option: expected one of "staging"|"production"'}
        </span>
        {'\n'}
        <span className={styles.dim}>Run "mycli deploy --help" for usage.</span>
        {'\n\n'}
        <Line command="mycli depoly" />
        <span className={styles.bad}>mycli: Unknown command "depoly". Did you mean "deploy"?</span>
        {'\n'}
        <span className={styles.dim}>Run "mycli --help" for usage.</span>
        {'\n\n'}
        <Line command="echo $?" />
        {'2\n'}
      </>
    ),
  },
]

function Terminal() {
  const [active, setActive] = useState(0)
  return (
    <div className={styles.terminal}>
      <div className={styles.terminalBar}>
        <div className={styles.tabs} role="tablist">
          {sessions.map((session, index) => (
            <button
              key={session.tab}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={index === active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setActive(index)}
            >
              {session.tab}
            </button>
          ))}
        </div>
      </div>
      <pre className={styles.terminalBody}>{sessions[active].lines}</pre>
    </div>
  )
}

function Install() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className={styles.install}>
      <span className={styles.prompt} aria-hidden="true">
        $
      </span>
      <code>{installCommand}</code>
      <button type="button" onClick={copy}>
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  )
}

function Hero() {
  return (
    <header className={styles.hero}>
      <div>
        <div className={styles.eyebrow}>@navios/commander 2.0 alpha</div>
        <h1 className={styles.title}>Command line apps, built like the rest of your app</h1>
        <p className={styles.lead}>
          A command is a class with injected services. Its options are one schema: the parser, the
          validation, the help text and the types of <code>execute()</code> all come from it.
        </p>
        <div className={styles.actions}>
          <Link className={`${styles.button} ${styles.primary}`} href="/docs/quick-start">
            Quick start
          </Link>
          <Link className={styles.button} href="/docs/reference/migrating-to-2">
            Coming from 1.x
          </Link>
        </div>
        <Install />
      </div>
      <Terminal />
    </header>
  )
}

const steps = [
  {
    title: 'Describe the options',
    code: `const options = z.object({
  env: z.enum(['staging', 'production']),
  dryRun: z.boolean().default(false).meta({
    alias: 'n',
    description: 'Change nothing',
  }),
  tag: z.array(z.string()).default([]),
})`,
  },
  {
    title: 'Write the command',
    code: `@Command({
  path: 'deploy <env>',
  description: 'Deploy the application',
  options,
})
class DeployCommand {
  private deployer = inject(Deployer)

  execute(o: CommandOptions<typeof options>) {
    return this.deployer.deploy(o)
  }
}`,
  },
  {
    title: 'Run it',
    code: `@Module({ commands: [DeployCommand] })
class AppModule {}

await runCli(AppModule, {
  name: 'mycli',
  version: '1.0.0',
})`,
  },
]

function Steps() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Three pieces</h2>
      <p className={styles.sectionLead}>
        That is the whole program behind the terminal above. No option is declared twice, and
        nothing is parsed by hand.
      </p>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div key={step.title} className={styles.step}>
            <div className={styles.stepHead}>
              <div className={styles.stepNumber}>0{index + 1}</div>
              <div className={styles.stepTitle}>{step.title}</div>
            </div>
            <pre className={styles.stepCode}>{step.code}</pre>
          </div>
        ))}
      </div>
    </section>
  )
}

const features = [
  {
    title: 'The schema is the interface',
    text: 'Types of options, aliases, defaults, choices and descriptions are read from a zod schema. --name 123 stays a string when the schema says string.',
    link: '/docs/essentials/arguments-and-options',
  },
  {
    title: 'Errors people can act on',
    text: 'Unknown options and commands suggest the nearest match. Validation issues name the flag. Exit codes follow convention: 2 for usage, yours for the rest.',
    link: '/docs/essentials/help-and-errors',
  },
  {
    title: 'Dependency injection',
    text: 'Commands inject services the same way controllers do, and share modules with your server. Replace a service with one line in a test.',
    link: '/docs/essentials/services-and-modules',
  },
  {
    title: 'Tests without a process',
    text: 'createTestCli runs a command line in memory and hands back stdout, stderr and the exit code.',
    link: '/docs/guides/testing',
  },
  {
    title: 'Starts fast, stays fast',
    text: 'Nothing is built until a command needs it. Lazy commands import their code only when they run.',
    link: '/docs/guides/lazy-commands',
  },
  {
    title: 'A terminal interface when you want one',
    text: 'Screens, progress bars, tables and prompts with Ink or OpenTUI. Piped or in CI, the same code prints plain lines.',
    link: '/docs/tui/',
  },
]

function Features() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>What you get</h2>
      <div className={styles.grid}>
        {features.map((feature) => (
          <div key={feature.title} className={styles.cell}>
            <div className={styles.cellTitle}>{feature.title}</div>
            <p className={styles.cellText}>{feature.text}</p>
            <Link className={styles.cellLink} href={feature.link}>
              read more →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

const packages = [
  {
    name: '@navios/commander',
    text: 'Commands, the parser, help and the test helper. All you need for a CLI.',
    link: '/docs/quick-start',
  },
  {
    name: '@navios/commander-tui',
    text: 'Screens, logs, progress and prompts, with or without a terminal.',
    link: '/docs/tui/',
  },
  {
    name: '@navios/tui-adapter-ink',
    text: 'Draws the interface with Ink. Runs on any supported Node.js.',
    link: '/docs/tui/adapters',
  },
  {
    name: '@navios/tui-adapter-react',
    text: 'Draws the interface with OpenTUI: native rendering, mouse, syntax highlighting.',
    link: '/docs/tui/adapters',
  },
]

function Packages() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Packages</h2>
      <div className={styles.packages}>
        {packages.map((pkg) => (
          <Link key={pkg.name} href={pkg.link} className={styles.package}>
            <div className={styles.packageName}>{pkg.name}</div>
            <div className={styles.packageText}>{pkg.text}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export const frontmatter = { pageType: 'custom' }

export default function Home(): ReactNode {
  return (
    <div className={styles.home}>
      <Hero />
      <main>
        <Steps />
        <Features />
        <Packages />
      </main>
    </div>
  )
}
