import { Box, Text } from 'ink'

import { useTheme } from '../../hooks/index.ts'

export function SidebarSeparator() {
  const theme = useTheme()

  return (
    <Box flexDirection="row" paddingTop={1}>
      <Box flexGrow={1} />
      <Text color={theme.separator.line}>· · ·</Text>
      <Box flexGrow={1} />
    </Box>
  )
}
