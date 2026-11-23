import { Text } from 'ink'
import { describe, expect, it, vi } from 'vitest'

import { useScreenSize } from '../../fullscreen/index.ts'

import { testRender } from './test_helpers.ts'

function SizeProbe() {
  const { width, height } = useScreenSize()
  return <Text>{`size=${width}x${height}`}</Text>
}

describe('useScreenSize (real Ink)', () => {
  it('reports the terminal size', async () => {
    const { lastFrame, unmount, waitForFrame } = await testRender(<SizeProbe />, {
      columns: 80,
      rows: 24,
    })
    await waitForFrame()

    expect(lastFrame()).toContain('size=80x24')
    unmount()
  })

  it('follows terminal resizes', async () => {
    const { stdout, lastFrame, unmount, waitForFrame } = await testRender(<SizeProbe />, {
      columns: 80,
      rows: 24,
    })
    await waitForFrame()

    stdout.columns = 100
    stdout.rows = 30
    stdout.emit('resize')

    await vi.waitFor(() => expect(lastFrame()).toContain('size=100x30'))
    unmount()
  })
})
