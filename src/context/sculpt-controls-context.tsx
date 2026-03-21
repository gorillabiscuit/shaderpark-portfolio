import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {
  DEFAULT_SCULPT_VISUAL,
  defaultPerBreakpointSettings,
  hexToRgb01,
  loadPerBreakpointSettings,
  sanitizeSculptVisualSettings,
  savePerBreakpointSettings,
  toUniformSnapshot,
  type PerBreakpointSculptSettings,
  type SculptVisualSettings,
} from '@/lib/sculptControls'
import {
  activeViewportBreakpoint,
  breakpointMinWidth,
  TAILWIND_MIN_WIDTHS,
  type ViewportBreakpointId,
} from '@/lib/viewportBreakpoint'

/** Captured at module load before any pause patch replaces `Date.now`. */
const NATIVE_DATE_NOW = Date.now

type SculptControlsContextValue = {
  uniformsRef: MutableRefObject<ReturnType<typeof toUniformSnapshot>>
  /** WebGL clear RGB (sRGB 0–1); read each frame by ShaderParkBackground patches. */
  clearRgbRef: MutableRefObject<{ r: number; g: number; b: number }>
  /** Same as `timePaused`; for listeners that must read latest without effect deps. */
  timePausedRef: MutableRefObject<boolean>
  timePaused: boolean
  setTimePaused: React.Dispatch<React.SetStateAction<boolean>>
  sculptPanelOpen: boolean
  setSculptPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
  perBreakpoint: PerBreakpointSculptSettings
  setPerBreakpoint: React.Dispatch<React.SetStateAction<PerBreakpointSculptSettings>>
  editBreakpoint: ViewportBreakpointId
  setEditBreakpoint: (id: ViewportBreakpointId) => void
  liveBreakpoint: ViewportBreakpointId
  patchEditSlice: (patch: Partial<SculptVisualSettings>) => void
  resetEditSlice: () => void
}

const SculptControlsContext = createContext<SculptControlsContextValue | null>(null)

export function useSculptControls() {
  const ctx = useContext(SculptControlsContext)
  if (!ctx) throw new Error('useSculptControls must be used within SculptControlsProvider')
  return ctx
}

export function SculptControlsProvider({ children }: { children: ReactNode }) {
  const uniformsRef = useRef(toUniformSnapshot(DEFAULT_SCULPT_VISUAL))
  const clearRgbRef = useRef(hexToRgb01(DEFAULT_SCULPT_VISUAL.bgColor))
  const [timePaused, setTimePaused] = useState(false)
  const timePausedRef = useRef(timePaused)
  timePausedRef.current = timePaused
  const [sculptPanelOpen, setSculptPanelOpen] = useState(false)
  const [perBreakpoint, setPerBreakpoint] = useState<PerBreakpointSculptSettings>(() => {
    return loadPerBreakpointSettings() ?? defaultPerBreakpointSettings()
  })
  const [liveW, setLiveW] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 1024),
  )
  const [editBreakpoint, setEditBreakpoint] = useState<ViewportBreakpointId>('base')

  const liveBreakpoint = useMemo(() => activeViewportBreakpoint(liveW), [liveW])

  /**
   * Minimal renderer sets `time` as `(Date.now() - oTime) * 0.001` after user uniforms.
   * Intercepting `gl.uniform1f` is unreliable (`WebGLUniformLocation` may not be `===`).
   * Freezing `Date.now` while paused keeps that expression constant.
   */
  useEffect(() => {
    if (!timePaused) {
      Date.now = NATIVE_DATE_NOW
      return () => {
        Date.now = NATIVE_DATE_NOW
      }
    }
    const frozenMs = NATIVE_DATE_NOW()
    Date.now = () => frozenMs
    return () => {
      Date.now = NATIVE_DATE_NOW
    }
  }, [timePaused])

  useEffect(() => {
    const onResize = () => setLiveW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const liveSlice = useMemo(
    () => sanitizeSculptVisualSettings(perBreakpoint[liveBreakpoint]),
    [perBreakpoint, liveBreakpoint],
  )

  useEffect(() => {
    uniformsRef.current = toUniformSnapshot(liveSlice)
  }, [liveSlice])

  const editSliceBg = perBreakpoint[editBreakpoint].bgColor
  useEffect(() => {
    const hex = sculptPanelOpen ? editSliceBg : liveSlice.bgColor
    clearRgbRef.current = hexToRgb01(hex)
  }, [sculptPanelOpen, editSliceBg, liveSlice.bgColor])

  const patchEditSlice = useCallback((patch: Partial<SculptVisualSettings>) => {
    setPerBreakpoint((prev) => ({
      ...prev,
      [editBreakpoint]: { ...prev[editBreakpoint], ...patch },
    }))
  }, [editBreakpoint])

  const resetEditSlice = useCallback(() => {
    setPerBreakpoint((prev) => ({
      ...prev,
      [editBreakpoint]: { ...DEFAULT_SCULPT_VISUAL },
    }))
  }, [editBreakpoint])

  useEffect(() => {
    const t = window.setTimeout(() => savePerBreakpointSettings(perBreakpoint), 400)
    return () => window.clearTimeout(t)
  }, [perBreakpoint])

  const value = useMemo(
    () => ({
      uniformsRef,
      clearRgbRef,
      timePausedRef,
      timePaused,
      setTimePaused,
      sculptPanelOpen,
      setSculptPanelOpen,
      perBreakpoint,
      setPerBreakpoint,
      editBreakpoint,
      setEditBreakpoint,
      liveBreakpoint,
      patchEditSlice,
      resetEditSlice,
    }),
    [
      perBreakpoint,
      editBreakpoint,
      liveBreakpoint,
      timePaused,
      sculptPanelOpen,
      patchEditSlice,
      resetEditSlice,
    ],
  )

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: liveSlice.bgColor }}
      />
      <SculptControlsContext.Provider value={value}>{children}</SculptControlsContext.Provider>
    </>
  )
}

export function sculptBreakpointLabel(id: ViewportBreakpointId): string {
  if (id === 'base') return `< ${TAILWIND_MIN_WIDTHS.sm}px`
  return `≥ ${breakpointMinWidth(id)}px`
}
