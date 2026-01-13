import { useTheme } from '../../hooks/index.ts'

export function SidebarSeparator() {
  const theme = useTheme()

  return (
    <box flexDirection="row" paddingTop={1}>
      <box flexGrow={1} />
      <text fg={theme.separator.line}>· · ·</text>
      <box flexGrow={1} />
    </box>
  )
}
