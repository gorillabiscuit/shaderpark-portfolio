import { ShaderParkBackground } from '@/components/ShaderParkBackground'
import { useSculptControls } from '@/context/sculpt-controls-context'

/** Lazy entry: pulls `uniformsRef` from `SculptControlsProvider` for the main app background. */
export default function AppShaderDock() {
  const { uniformsRef, clearRgbRef, timePausedRef, sculptSource } = useSculptControls()
  return (
    <ShaderParkBackground
      variant="fullscreen"
      sculptSource={sculptSource}
      uniformsRef={uniformsRef}
      clearRgbRef={clearRgbRef}
      ignoreGlobalPointerRef={timePausedRef}
    />
  )
}
