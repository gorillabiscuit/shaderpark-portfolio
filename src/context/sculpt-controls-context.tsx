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
import type { BackgroundAppearanceMode } from '@/config/backgroundTheme'
import {
  DEFAULT_SCULPT_VISUAL,
  buildPanelsByTheme,
  defaultSculptSliceForTheme,
  defaultTransformsPerBreakpoint,
  extractAppearance,
  extractTransform,
  hexToRgb01,
  loadSculptStorageState,
  mergeVisual,
  sanitizeSculptVisualSettings,
  saveSculptStorageState,
  toUniformSnapshot,
  type PerBreakpointSculptSettings,
  type SculptPanelsByTheme,
  type SculptStorageState,
  type SculptVisualSettings,
} from '@/lib/sculptControls'
import { useTheme } from 'next-themes'
import {
  activeViewportBreakpoint,
  breakpointMinWidth,
  TAILWIND_MIN_WIDTHS,
  VIEWPORT_BREAKPOINT_ORDER,
  type ViewportBreakpointId,
} from '@/lib/viewportBreakpoint'

/** Captured at module load before any pause patch replaces `Date.now`. */
const NATIVE_DATE_NOW = Date.now

type SculptControlsContextValue = {
  uniformsRef: MutableRefObject<ReturnType<typeof toUniformSnapshot>>
  /** WebGL clear RGB (sRGB 0–1); read each frame by ShaderParkBackground patches. */
  clearRgbRef: MutableRefObject<{ r: number; g: number; b: number }>
  /** Derived from site theme (`next-themes`). Separate appearance per mode; transforms shared. */
  backgroundAppearanceMode: BackgroundAppearanceMode
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
  /** Update any theme’s breakpoint slice (e.g. set light bg while dark theme is active). */
  patchBreakpointSliceForTheme: (
    mode: BackgroundAppearanceMode,
    breakpoint: ViewportBreakpointId,
    patch: Partial<SculptVisualSettings>,
  ) => void
  /** Full merged panels for UI (dark/light × breakpoints). */
  panelsByTheme: SculptPanelsByTheme
  resetEditSlice: () => void
}

const SculptControlsContext = createContext<SculptControlsContextValue | null>(null)

export function useSculptControls() {
  const ctx = useContext(SculptControlsContext)
  if (!ctx) throw new Error('useSculptControls must be used within SculptControlsProvider')
  return ctx
}

export function SculptControlsProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const backgroundAppearanceMode: BackgroundAppearanceMode =
    resolvedTheme === 'light' ? 'light' : 'dark'

  const uniformsRef = useRef(toUniformSnapshot(defaultSculptSliceForTheme('dark')))
  const clearRgbRef = useRef(hexToRgb01(defaultSculptSliceForTheme('dark').bgColor))
  const [timePaused, setTimePaused] = useState(false)
  const timePausedRef = useRef(timePaused)
  timePausedRef.current = timePaused
  const [sculptPanelOpen, setSculptPanelOpen] = useState(false)
  const [storage, setStorage] = useState<SculptStorageState>(loadSculptStorageState)

  const panelsByTheme = useMemo(() => buildPanelsByTheme(storage), [storage])

  const perBreakpoint = panelsByTheme[backgroundAppearanceMode]

  const setPerBreakpoint = useCallback<
    React.Dispatch<React.SetStateAction<PerBreakpointSculptSettings>>
  >(
    (action) => {
      setStorage((prev) => {
        const currentPanel = buildPanelsByTheme(prev)[backgroundAppearanceMode]
        const nextPanel =
          typeof action === 'function'
            ? (action as (p: PerBreakpointSculptSettings) => PerBreakpointSculptSettings)(
                currentPanel,
              )
            : action
        const newTransforms = { ...prev.transforms }
        const newAppearanceRow = { ...prev.appearance[backgroundAppearanceMode] }
        for (const id of VIEWPORT_BREAKPOINT_ORDER) {
          newTransforms[id] = extractTransform(nextPanel[id])
          newAppearanceRow[id] = extractAppearance(nextPanel[id])
        }
        return {
          ...prev,
          transforms: newTransforms,
          appearance: {
            ...prev.appearance,
            [backgroundAppearanceMode]: newAppearanceRow,
          },
        }
      })
    },
    [backgroundAppearanceMode],
  )

  const [liveW, setLiveW] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 1024),
  )
  const [editBreakpoint, setEditBreakpoint] = useState<ViewportBreakpointId>('base')

  const liveBreakpoint = useMemo(() => activeViewportBreakpoint(liveW), [liveW])

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

  const patchEditSlice = useCallback(
    (patch: Partial<SculptVisualSettings>) => {
      setStorage((prev) => {
        const mode = backgroundAppearanceMode
        const bp = editBreakpoint
        let transforms = prev.transforms
        const { uPosX, uPosY, uPosZ, _scale, ...appearancePatch } = patch
        if (
          uPosX !== undefined ||
          uPosY !== undefined ||
          uPosZ !== undefined ||
          _scale !== undefined
        ) {
          const cur = prev.transforms[bp]
          transforms = {
            ...prev.transforms,
            [bp]: extractTransform(
              sanitizeSculptVisualSettings({
                ...DEFAULT_SCULPT_VISUAL,
                ...cur,
                ...(uPosX !== undefined ? { uPosX } : {}),
                ...(uPosY !== undefined ? { uPosY } : {}),
                ...(uPosZ !== undefined ? { uPosZ } : {}),
                ...(_scale !== undefined ? { _scale } : {}),
              }),
            ),
          }
        }
        let appearance = prev.appearance
        if (Object.keys(appearancePatch).length > 0) {
          const curApp = prev.appearance[mode][bp]
          const mergedFull = sanitizeSculptVisualSettings({
            ...mergeVisual(curApp, prev.transforms[bp]),
            ...appearancePatch,
          })
          appearance = {
            ...prev.appearance,
            [mode]: {
              ...prev.appearance[mode],
              [bp]: extractAppearance(mergedFull),
            },
          }
        }
        return { ...prev, transforms, appearance }
      })
    },
    [backgroundAppearanceMode, editBreakpoint],
  )

  const patchBreakpointSliceForTheme = useCallback(
    (mode: BackgroundAppearanceMode, breakpoint: ViewportBreakpointId, patch: Partial<SculptVisualSettings>) => {
      setStorage((prev) => {
        const { uPosX, uPosY, uPosZ, _scale, ...appearancePatch } = patch
        let transforms = prev.transforms
        if (
          uPosX !== undefined ||
          uPosY !== undefined ||
          uPosZ !== undefined ||
          _scale !== undefined
        ) {
          const cur = prev.transforms[breakpoint]
          transforms = {
            ...prev.transforms,
            [breakpoint]: extractTransform(
              sanitizeSculptVisualSettings({
                ...DEFAULT_SCULPT_VISUAL,
                ...cur,
                ...(uPosX !== undefined ? { uPosX } : {}),
                ...(uPosY !== undefined ? { uPosY } : {}),
                ...(uPosZ !== undefined ? { uPosZ } : {}),
                ...(_scale !== undefined ? { _scale } : {}),
              }),
            ),
          }
        }
        let appearance = prev.appearance
        if (Object.keys(appearancePatch).length > 0) {
          const curApp = prev.appearance[mode][breakpoint]
          const mergedFull = sanitizeSculptVisualSettings({
            ...mergeVisual(curApp, prev.transforms[breakpoint]),
            ...appearancePatch,
          })
          appearance = {
            ...prev.appearance,
            [mode]: {
              ...prev.appearance[mode],
              [breakpoint]: extractAppearance(mergedFull),
            },
          }
        }
        return { ...prev, transforms, appearance }
      })
    },
    [],
  )

  const resetEditSlice = useCallback(() => {
    setStorage((prev) => {
      const mode = backgroundAppearanceMode
      const bp = editBreakpoint
      return {
        ...prev,
        transforms: {
          ...prev.transforms,
          [bp]: defaultTransformsPerBreakpoint()[bp],
        },
        appearance: {
          ...prev.appearance,
          [mode]: {
            ...prev.appearance[mode],
            [bp]: extractAppearance(defaultSculptSliceForTheme(mode)),
          },
        },
      }
    })
  }, [backgroundAppearanceMode, editBreakpoint])

  useEffect(() => {
    const t = window.setTimeout(() => saveSculptStorageState(storage), 400)
    return () => window.clearTimeout(t)
  }, [storage])

  const value = useMemo(
    () => ({
      uniformsRef,
      clearRgbRef,
      backgroundAppearanceMode,
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
      patchBreakpointSliceForTheme,
      panelsByTheme,
      resetEditSlice,
    }),
    [
      backgroundAppearanceMode,
      panelsByTheme,
      perBreakpoint,
      editBreakpoint,
      liveBreakpoint,
      timePaused,
      sculptPanelOpen,
      patchEditSlice,
      patchBreakpointSliceForTheme,
      resetEditSlice,
      setPerBreakpoint,
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
