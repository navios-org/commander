import { describe, expect, it } from 'bun:test'

import { LoggerProvider, useLoggerContext } from '../../context/index.ts'

import { testRender, TEST_DIMENSIONS } from './test_helpers.ts'

function SyntaxStyleProbe() {
  const { syntaxStyle } = useLoggerContext()
  return <text>{syntaxStyle ? 'syntax-style:created' : 'syntax-style:missing'}</text>
}

describe('LoggerProvider inside an OpenTUI renderer', () => {
  it('creates a SyntaxStyle owned by the renderer', async () => {
    const { renderer, renderOnce, captureCharFrame } = await testRender(
      <LoggerProvider>
        <SyntaxStyleProbe />
      </LoggerProvider>,
      TEST_DIMENSIONS,
    )

    await renderOnce()
    expect(captureCharFrame()).toContain('syntax-style:created')
    renderer.destroy()
  })
})
