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
  patchAppearanceOnlyFields,
  sanitizeSculptVisualSettings,
  saveSculptStorageState,
  toUniformSnapshot,
  type PerBreakpointPositionScale,
  type PerBreakpointSculptSettings,
  type SculptPanelsByTheme,
  type SculptStorageState,
  type SculptVisualSettings,
} from '@/lib/sculptControls'
import { useTheme } from 'next-themes'
import { useLocation } from 'react-router-dom'
import { isAppMainShaderRoute } from '@/lib/shaderParkAppRoutes'
import { isFullSculptDebugHost } from '@/lib/sculptPanelHost'
import { sculptSourceForScene, type SculptSceneId } from '@/lib/shaderParkRenderSettings'
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
  /** Shared position/scale per viewport tier (not theme-specific). */
  perBreakpointTransforms: PerBreakpointPositionScale
  setPerBreakpoint: React.Dispatch<React.SetStateAction<PerBreakpointSculptSettings>>
  editBreakpoint: ViewportBreakpointId
  setEditBreakpoint: (id: ViewportBreakpointId) => void
  liveBreakpoint: ViewportBreakpointId
  patchEditSlice: (patch: Partial<SculptVisualSettings>) => void
  /** Material / background for a site theme (not tied to viewport tier). */
  patchAppearanceForTheme: (
    mode: BackgroundAppearanceMode,
    patch: Partial<SculptVisualSettings>,
  ) => void
  /** Full merged panels for UI (dark/light × breakpoints). */
  panelsByTheme: SculptPanelsByTheme
  resetEditSlice: () => void
  /** Compiled sculpt (low raymarch tier only). */
  sculptSource: string
  /** Active background sculpture (1 = torus composition, 2 = sphere). */
  sculptSceneId: SculptSceneId
  setSculptSceneId: React.Dispatch<React.SetStateAction<SculptSceneId>>
  /** False only on www.wouterschreuders.com (slim panel). True on localhost and other hosts. */
  fullSculptDebug: boolean
}

const SculptControlsContext = createContext<SculptControlsContextValue | null>(null)

export function useSculptControls() {
  const ctx = useContext(SculptControlsContext)
  if (!ctx) throw new Error('useSculptControls must be used within SculptControlsProvider')
  return ctx
}

export function SculptControlsProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
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

  const fullSculptDebug = isFullSculptDebugHost()
  const [sculptSceneId, setSculptSceneId] = useState<SculptSceneId>(1)
  const sculptSource = useMemo(
    () => sculptSourceForScene(sculptSceneId),
    [sculptSceneId],
  )

  const panelsByTheme = useMemo(() => buildPanelsByTheme(storage), [storage])

  const perBreakpoint = panelsByTheme[backgroundAppearanceMode]
  const perBreakpointTransforms = storage.transforms

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
        for (const id of VIEWPORT_BREAKPOINT_ORDER) {
          newTransforms[id] = extractTransform(nextPanel[id])
        }
        const canonical =
          nextPanel.base ??
          VIEWPORT_BREAKPOINT_ORDER.map((id) => nextPanel[id]).find(Boolean)
        const newAppearanceOnly = extractAppearance(
          canonical ?? mergeVisual(prev.appearance[backgroundAppearanceMode], newTransforms.base),
        )
        return {
          ...prev,
          transforms: newTransforms,
          appearance: {
            ...prev.appearance,
            [backgroundAppearanceMode]: newAppearanceOnly,
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

  useEffect(() => {
    if (!isAppMainShaderRoute(pathname)) {
      setSculptPanelOpen(false)
      setTimePaused(false)
    }
  }, [pathname])

  const liveSlice = useMemo(
    () => sanitizeSculptVisualSettings(perBreakpoint[liveBreakpoint]),
    [perBreakpoint, liveBreakpoint],
  )

  useEffect(() => {
    uniformsRef.current = toUniformSnapshot(liveSlice)
  }, [liveSlice])

  const editSliceBg = storage.appearance[backgroundAppearanceMode].bgColor
  useEffect(() => {
    const hex = sculptPanelOpen ? editSliceBg : liveSlice.bgColor
    clearRgbRef.current = hexToRgb01(hex)
  }, [sculptPanelOpen, editSliceBg, liveSlice.bgColor])

  const patchEditSlice = useCallback(
    (patch: Partial<SculptVisualSettings>) => {
      setStorage((prev) => {
        const mode = backgroundAppearanceMode
        const bp = fullSculptDebug ? editBreakpoint : liveBreakpoint
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
          appearance = {
            ...prev.appearance,
            [mode]: patchAppearanceOnlyFields(prev.appearance[mode], appearancePatch),
          }
        }
        return { ...prev, transforms, appearance }
      })
    },
    [backgroundAppearanceMode, editBreakpoint, liveBreakpoint, fullSculptDebug],
  )

  const patchAppearanceForTheme = useCallback(
    (mode: BackgroundAppearanceMode, patch: Partial<SculptVisualSettings>) => {
      setStorage((prev) => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          [mode]: patchAppearanceOnlyFields(prev.appearance[mode], patch),
        },
      }))
    },
    [],
  )

  const resetEditSlice = useCallback(() => {
    setStorage((prev) => {
      const bp = fullSculptDebug ? editBreakpoint : liveBreakpoint
      return {
        ...prev,
        transforms: {
          ...prev.transforms,
          [bp]: defaultTransformsPerBreakpoint()[bp],
        },
      }
    })
  }, [editBreakpoint, liveBreakpoint, fullSculptDebug])

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
      perBreakpointTransforms,
      setPerBreakpoint,
      editBreakpoint,
      setEditBreakpoint,
      liveBreakpoint,
      patchEditSlice,
      patchAppearanceForTheme,
      panelsByTheme,
      resetEditSlice,
      sculptSource,
      sculptSceneId,
      setSculptSceneId,
      fullSculptDebug,
    }),
    [
      backgroundAppearanceMode,
      panelsByTheme,
      perBreakpoint,
      perBreakpointTransforms,
      editBreakpoint,
      liveBreakpoint,
      timePaused,
      sculptPanelOpen,
      patchEditSlice,
      patchAppearanceForTheme,
      resetEditSlice,
      setPerBreakpoint,
      sculptSource,
      sculptSceneId,
      fullSculptDebug,
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
