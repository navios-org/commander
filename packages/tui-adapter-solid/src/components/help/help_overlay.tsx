import { TextAttributes } from '@opentui/core'
import { For, Show, createMemo } from 'solid-js'

import { useTheme } from '../../hooks/index.ts'
import { formatKeyBinding } from '@navios/commander-tui'

import type { KeyBinding, KeyBindingCategory } from '@navios/commander-tui'

export interface HelpOverlayProps {
  bindings: KeyBinding[]
}

const CATEGORY_ORDER: KeyBindingCategory[] = ['general', 'navigation', 'screen', 'filter', 'prompt']

const CATEGORY_LABELS: Record<KeyBindingCategory, string> = {
  general: 'General',
  navigation: 'Navigation',
  screen: 'Screen',
  filter: 'Filter',
  prompt: 'Prompts',
}

function groupByCategory(bindings: KeyBinding[]): Record<KeyBindingCategory, KeyBinding[]> {
  const grouped: Record<KeyBindingCategory, KeyBinding[]> = {
    general: [],
    navigation: [],
    screen: [],
    filter: [],
    prompt: [],
  }

  for (const binding of bindings) {
    if (binding.description) {
      grouped[binding.category].push(binding)
    }
  }

  return grouped
}

export function HelpOverlay(props: HelpOverlayProps) {
  const theme = useTheme()
  const grouped = createMemo(() => groupByCategory(props.bindings))

  return (
    <box
      position="absolute"
      top={1}
      left={2}
      right={2}
      bottom={1}
      backgroundColor={theme.help.background}
      borderColor={theme.help.border}
      border={['top', 'bottom', 'left', 'right']}
      flexDirection="column"
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text fg={theme.help.title} attributes={TextAttributes.BOLD}>
          Keyboard Shortcuts
        </text>
      </box>

      {/* Categories */}
      <scrollbox scrollY flexGrow={1}>
        <box flexDirection="column" gap={1}>
          <For each={CATEGORY_ORDER}>
            {(category) => {
              const categoryBindings = () => grouped()[category]

              return (
                <Show when={categoryBindings().length > 0}>
                  <box flexDirection="column">
                    <text fg={theme.help.category} attributes={TextAttributes.BOLD}>
                      {CATEGORY_LABELS[category]}
                    </text>

                    <For each={categoryBindings()}>
                      {(binding) => (
                        <box flexDirection="row" paddingLeft={2}>
                          <text fg={theme.help.key} width={14}>
                            {formatKeyBinding(binding)}
                          </text>
                          <text fg={theme.help.description}>{binding.description}</text>
                        </box>
                      )}
                    </For>
                  </box>
                </Show>
              )
            }}
          </For>
        </box>
      </scrollbox>

      {/* Footer */}
      <box marginTop={1} borderColor={theme.separator.line} border={['top']} paddingTop={1}>
        <text fg={theme.help.hint}>Press ? or Esc to close</text>
      </box>
    </box>
  )
}
