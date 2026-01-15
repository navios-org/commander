import { Box, Text } from 'ink'
import { useScreenSize } from 'fullscreen-ink'

import { useTheme } from '../../hooks/index.ts'
import { formatKeyBinding } from '../../../../keyboard/index.ts'

import type { KeyBinding, KeyBindingCategory } from '../../../../types/index.ts'

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

export function HelpOverlay({ bindings }: HelpOverlayProps) {
  const theme = useTheme()
  const grouped = groupByCategory(bindings)
  const { width, height } = useScreenSize()

  return (
    <Box
      position="absolute"
      width={width}
      height={height}
      justifyContent="center"
      alignItems="center"
    >
      <Box
        flexDirection="column"
        backgroundColor={theme.help.background}
        borderStyle="round"
        borderColor={theme.help.border}
        paddingLeft={2}
        paddingRight={2}
        paddingTop={1}
        paddingBottom={1}
      >
        {/* Header */}
        <Box marginBottom={1}>
          <Text color={theme.help.title} bold>
            Keyboard Shortcuts
          </Text>
        </Box>

        {/* Categories */}
        <Box flexDirection="column" gap={1}>
          {CATEGORY_ORDER.map((category) => {
            const categoryBindings = grouped[category]
            if (categoryBindings.length === 0) return null

            return (
              <Box key={category} flexDirection="column">
                <Text color={theme.help.category} bold>
                  {CATEGORY_LABELS[category]}
                </Text>

                {categoryBindings.map((binding, index) => (
                  <Box key={`${binding.key}-${index}`} flexDirection="row" paddingLeft={2}>
                    <Box width={14}>
                      <Text color={theme.help.key}>{formatKeyBinding(binding)}</Text>
                    </Box>
                    <Text color={theme.help.description}>{binding.description}</Text>
                  </Box>
                ))}
              </Box>
            )
          })}
        </Box>

        {/* Footer */}
        <Box
          marginTop={1}
          borderStyle="single"
          borderTop
          borderBottom={false}
          borderLeft={false}
          borderRight={false}
          borderColor={theme.separator.line}
          paddingTop={1}
        >
          <Text color={theme.help.hint}>Press ? or Esc to close</Text>
        </Box>
      </Box>
    </Box>
  )
}
