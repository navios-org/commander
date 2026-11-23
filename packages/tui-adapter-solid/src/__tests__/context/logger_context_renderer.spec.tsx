import { describe, expect, it } from 'bun:test'

import { testRender } from '@opentui/solid'

import { LoggerProvider, useLoggerContext } from '../../context/index.ts'

function SyntaxStyleProbe() {
  const context = useLoggerContext()
  return <text>{context.syntaxStyle ? 'syntax-style:created' : 'syntax-style:missing'}</text>
}

describe('LoggerProvider inside an OpenTUI renderer', () => {
  it('creates a SyntaxStyle owned by the renderer', async () => {
    const { renderer, renderOnce, captureCharFrame } = await testRender(
      () => (
        <LoggerProvider>
          <SyntaxStyleProbe />
        </LoggerProvider>
      ),
      { width: 80, height: 24 },
    )

    await renderOnce()
    expect(captureCharFrame()).toContain('syntax-style:created')
    renderer.destroy()
  })
})
