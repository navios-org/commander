/**
 * Bun test setup file for tui-adapter-react tests.
 *
 * Uses happy-dom for DOM environment needed by @testing-library/react.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator'

// Register happy-dom as the global DOM environment
GlobalRegistrator.register()
