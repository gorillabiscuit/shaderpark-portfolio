import { ShaderParkBackground } from '@/components/ShaderParkBackground'
import { useSculptControls } from '@/context/sculpt-controls-context'

/** Lazy entry: pulls `uniformsRef` from `SculptControlsProvider` for the main app background. */
export default function AppShaderDock() {
  const { uniformsRef, clearRgbRef, timePausedRef } = useSculptControls()
  return (
    <ShaderParkBackground
      variant="fullscreen"
      uniformsRef={uniformsRef}
      clearRgbRef={clearRgbRef}
      ignoreGlobalPointerRef={timePausedRef}
    />
  )
}
