import {
  BACKGROUND_THEME_SEED,
  type BackgroundAppearanceMode,
} from '@/config/backgroundTheme'
import type { ViewportBreakpointId } from '@/lib/viewportBreakpoint'
import { VIEWPORT_BREAKPOINT_ORDER } from '@/lib/viewportBreakpoint'
import type { Scene4PaletteByTheme, Scene4UniformSlice } from '@/lib/scene4Palette'
import {
  DEFAULT_SCENE4_PALETTE_BY_THEME,
  sanitizeScene4PaletteByTheme,
  sanitizeScene4UniformSlice,
} from '@/lib/scene4Palette'

/** Core sculpt `input()` uniforms (material, grade, transform) — no scene-3 extras. */
export type SculptUniformCore = {
  uMatR: number
  uMatG: number
  uMatB: number
  uHueShift: number
  uSat: number
  uValue: number
  uContrast: number
  uAmbient: number
  uRim: number
  uMetal: number
  uShine: number
  uBallMetal: number
  uPosX: number
  uPosY: number
  uPosZ: number
  _scale: number
}

/** Full snapshot passed to `updateUniforms`. */
export type SculptUniformSnapshot = SculptUniformCore & Scene4UniformSlice

export type SculptVisualSettings = SculptUniformCore & {
  /** Solid page / letterbox color (CSS). */
  bgColor: string
}

export const DEFAULT_SCULPT_VISUAL: SculptVisualSettings = {
  uMatR: 0.6235294117647059,
  uMatG: 0.9411764705882353,
  uMatB: 0.058823529411764705,
  uHueShift: 0.025,
  uSat: 1.37,
  uValue: 1.92,
  uContrast: 1.6,
  uAmbient: 0.015,
  uRim: 0,
  uMetal: 0.67,
  uShine: 0.66,
  uBallMetal: 0.69,
  uPosX: 0,
  uPosY: 0,
  uPosZ: 0,
  _scale: 1,
  bgColor: '#0e1629',
}

/** Author default transforms per viewport tier (merged on top of theme slice). */
export const DEFAULT_PER_BREAKPOINT_TRANSFORM_OVERRIDES: Partial<
  Record<ViewportBreakpointId, Pick<SculptUniformCore, 'uPosX' | 'uPosY' | 'uPosZ' | '_scale'>>
> = {
  md: { uPosX: 0, uPosY: 0, uPosZ: 0, _scale: 1.63 },
  lg: { uPosX: 0.345, uPosY: 0, uPosZ: 0, _scale: 1.81 },
  xl: { uPosX: 0.38, uPosY: 0, uPosZ: 0, _scale: 1.85 },
  '2xl': { uPosX: 0.29, uPosY: 0, uPosZ: 0, _scale: 2 },
}

export type PerBreakpointSculptSettings = Record<ViewportBreakpointId, SculptVisualSettings>

/** Per breakpoint in clipboard: transform only. */
export type SculptPositionScaleSlice = Pick<
  SculptUniformCore,
  'uPosX' | 'uPosY' | 'uPosZ' | '_scale'
>

export type PerBreakpointPositionScale = Record<ViewportBreakpointId, SculptPositionScaleSlice>

/** Material, grade, bg — grouped in `SculptStorageState` separately from per-breakpoint transforms. */
export type SculptAppearanceOnly = Omit<
  SculptVisualSettings,
  'uPosX' | 'uPosY' | 'uPosZ' | '_scale'
>

/** @deprecated v3 only — appearance was duplicated per breakpoint */
export type PerBreakpointAppearanceByTheme = Record<
  BackgroundAppearanceMode,
  Record<ViewportBreakpointId, SculptAppearanceOnly>
>

/** Material / grade / bg per site theme only (not per viewport tier). */
export type AppearanceByTheme = Record<BackgroundAppearanceMode, SculptAppearanceOnly>

export type SculptStorageState = {
  transforms: PerBreakpointPositionScale
  appearance: AppearanceByTheme
  scene4PaletteByTheme: Scene4PaletteByTheme
}

export function extractTransform(s: SculptVisualSettings): SculptPositionScaleSlice {
  return { uPosX: s.uPosX, uPosY: s.uPosY, uPosZ: s.uPosZ, _scale: s._scale }
}

export function extractAppearance(s: SculptVisualSettings): SculptAppearanceOnly {
  const { uPosX, uPosY, uPosZ, _scale, ...appearance } = s
  return appearance
}

export function mergeVisual(
  appearance: SculptAppearanceOnly,
  t: SculptPositionScaleSlice,
): SculptVisualSettings {
  return sanitizeSculptVisualSettings({ ...appearance, ...t })
}

const NEUTRAL_TRANSFORM: SculptPositionScaleSlice = {
  uPosX: 0,
  uPosY: 0,
  uPosZ: 0,
  _scale: 1,
}

/** Merge partial sculpt fields into theme appearance (ignores position/scale in patch). */
export function patchAppearanceOnlyFields(
  current: SculptAppearanceOnly,
  patch: Partial<SculptVisualSettings>,
): SculptAppearanceOnly {
  const full = sanitizeSculptVisualSettings({
    ...mergeVisual(current, NEUTRAL_TRANSFORM),
    ...patch,
  })
  return extractAppearance(full)
}

/**
 * One theme: **one** `appearance` (material + bg) shared by every breakpoint row; only
 * `transforms[id]` (position / scale) varies per tier.
 */
export function buildPerBreakpointForTheme(
  appearance: SculptAppearanceOnly,
  transforms: PerBreakpointPositionScale,
): PerBreakpointSculptSettings {
  const row = {} as PerBreakpointSculptSettings
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    row[id] = mergeVisual(appearance, transforms[id])
  }
  return row
}

/** Single global look in clipboard (not repeated under each breakpoint). */
export type SculptAppearanceClipboardSlice = Pick<
  SculptVisualSettings,
  | 'uMatR'
  | 'uMatG'
  | 'uMatB'
  | 'uHueShift'
  | 'uSat'
  | 'uValue'
  | 'uContrast'
  | 'uAmbient'
  | 'uRim'
  | 'uMetal'
  | 'uShine'
  | 'uBallMetal'
  | 'bgColor'
>

export const SCULPT_CLIPBOARD_VERSION = 4 as const

export type SculptClipboardPayload = {
  version: typeof SCULPT_CLIPBOARD_VERSION
  /** Which site theme the `appearance` block describes. */
  appearanceMode: BackgroundAppearanceMode
  appearance: SculptAppearanceClipboardSlice
  perBreakpoint: PerBreakpointPositionScale
}

/**
 * Clipboard JSON: material + background for one theme; transforms for every breakpoint.
 */
export function buildSculptClipboardPayload(
  appearance: SculptAppearanceOnly,
  appearanceMode: BackgroundAppearanceMode,
  transforms: PerBreakpointPositionScale,
): SculptClipboardPayload {
  return {
    version: SCULPT_CLIPBOARD_VERSION,
    appearanceMode,
    appearance: {
      uMatR: appearance.uMatR,
      uMatG: appearance.uMatG,
      uMatB: appearance.uMatB,
      uHueShift: appearance.uHueShift,
      uSat: appearance.uSat,
      uValue: appearance.uValue,
      uContrast: appearance.uContrast,
      uAmbient: appearance.uAmbient,
      uRim: appearance.uRim,
      uMetal: appearance.uMetal,
      uShine: appearance.uShine,
      uBallMetal: appearance.uBallMetal,
      bgColor: appearance.bgColor,
    },
    perBreakpoint: { ...transforms },
  }
}

export function defaultPerBreakpointSettings(): PerBreakpointSculptSettings {
  return defaultPerBreakpointForTheme('dark')
}

export type SculptPanelsByTheme = Record<BackgroundAppearanceMode, PerBreakpointSculptSettings>

export function defaultTransformsPerBreakpoint(): PerBreakpointPositionScale {
  const row = {} as PerBreakpointPositionScale
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    const o = DEFAULT_PER_BREAKPOINT_TRANSFORM_OVERRIDES[id]
    row[id] = extractTransform(
      sanitizeSculptVisualSettings({
        ...DEFAULT_SCULPT_VISUAL,
        uPosX: o?.uPosX ?? 0,
        uPosY: o?.uPosY ?? 0,
        uPosZ: o?.uPosZ ?? 0,
        _scale: o?._scale ?? 1,
      }),
    )
  }
  return row
}

export function defaultAppearanceOnlyForTheme(mode: BackgroundAppearanceMode): SculptAppearanceOnly {
  return extractAppearance(defaultSculptSliceForTheme(mode))
}

export function defaultSculptStorageState(): SculptStorageState {
  return {
    transforms: defaultTransformsPerBreakpoint(),
    appearance: {
      dark: defaultAppearanceOnlyForTheme('dark'),
      light: defaultAppearanceOnlyForTheme('light'),
    },
    scene4PaletteByTheme: sanitizeScene4PaletteByTheme(DEFAULT_SCENE4_PALETTE_BY_THEME),
  }
}

/** Keys previously used for persisted sculpt settings (removed on load). */
const LEGACY_SCULPT_STORAGE_KEYS = [
  'shader-park-sculpt-panel-v3',
  'shader-park-sculpt-panel-v2',
  'shader-park-sculpt-panel-v1',
] as const

/**
 * Session-only in-memory defaults: sculpt UI state is not read from or written to localStorage.
 * Clears legacy keys so old installs do not leave stale data.
 */
export function loadSculptStorageState(): SculptStorageState {
  if (typeof localStorage !== 'undefined') {
    try {
      for (const key of LEGACY_SCULPT_STORAGE_KEYS) {
        localStorage.removeItem(key)
      }
    } catch {
      /* private mode / quota */
    }
  }
  return defaultSculptStorageState()
}

/** No-op — sculpt settings are not persisted. */
export function saveSculptStorageState(_state: SculptStorageState): void {}

export function buildPanelsByTheme(state: SculptStorageState): SculptPanelsByTheme {
  return {
    dark: buildPerBreakpointForTheme(state.appearance.dark, state.transforms),
    light: buildPerBreakpointForTheme(state.appearance.light, state.transforms),
  }
}

/** One breakpoint row: defaults + appearance seed (dark vs light plate). */
export function defaultSculptSliceForTheme(
  mode: BackgroundAppearanceMode,
): SculptVisualSettings {
  return sanitizeSculptVisualSettings({
    ...DEFAULT_SCULPT_VISUAL,
    ...BACKGROUND_THEME_SEED[mode],
  })
}

/** Defaults: same material/bg `seed` for every breakpoint; overrides are transform-only per tier. */
export function defaultPerBreakpointForTheme(
  mode: BackgroundAppearanceMode,
): PerBreakpointSculptSettings {
  const seed = defaultSculptSliceForTheme(mode)
  const row = {} as PerBreakpointSculptSettings
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    const t = DEFAULT_PER_BREAKPOINT_TRANSFORM_OVERRIDES[id]
    row[id] = sanitizeSculptVisualSettings({
      ...seed,
      ...(t ?? {}),
    })
  }
  return row
}

const HEX6 = /^#[0-9a-fA-F]{6}$/

function sanitizeHex(s: unknown, fallback: string): string {
  if (typeof s !== 'string') return fallback
  const h = s.startsWith('#') ? s : `#${s}`
  return HEX6.test(h) ? h : fallback
}

/** 0–1 RGB for WebGL `clearColor` / uniforms (sRGB channel values). */
export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const s = sanitizeHex(hex, DEFAULT_SCULPT_VISUAL.bgColor)
  const n = parseInt(s.slice(1), 16)
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  }
}

/**
 * PBR + rim term in shader-park-core: near-zero albedo makes diffuse/ambient vanish so only
 * the edge-glow contribution reads as “wireframe / outlines”. Clamp invalid storage and
 * rescue collapsed colors.
 */
type LoadedVisualSlice = Partial<SculptVisualSettings> & {
  /** Legacy gradient keys from v1 storage */
  bgTop?: string
  bgBottom?: string
}

export function sanitizeSculptVisualSettings(
  input: LoadedVisualSlice,
): SculptVisualSettings {
  const d = DEFAULT_SCULPT_VISUAL
  const num = (x: unknown, lo: number, hi: number, fb: number) => {
    const v = typeof x === 'number' ? x : Number(x)
    if (!Number.isFinite(v)) return fb
    return Math.min(hi, Math.max(lo, v))
  }

  let uMatR = num(input.uMatR, 0, 1, d.uMatR)
  let uMatG = num(input.uMatG, 0, 1, d.uMatG)
  let uMatB = num(input.uMatB, 0, 1, d.uMatB)
  if (uMatR + uMatG + uMatB < 0.02) {
    uMatR = d.uMatR
    uMatG = d.uMatG
    uMatB = d.uMatB
  }

  return {
    uMatR,
    uMatG,
    uMatB,
    uHueShift: num(input.uHueShift, -1, 1, d.uHueShift),
    uSat: num(input.uSat, 0, 2, d.uSat),
    uValue: num(input.uValue, 0, 2, d.uValue),
    uContrast: num(input.uContrast, 0.35, 2.2, d.uContrast),
    uAmbient: num(input.uAmbient, 0, 0.35, d.uAmbient),
    uRim: num(input.uRim, 0, 1, d.uRim),
    uMetal: num(input.uMetal, 0, 1, d.uMetal),
    uShine: num(input.uShine, 0, 1, d.uShine),
    uBallMetal: num(input.uBallMetal, 0, 1, d.uBallMetal),
    uPosX: num(input.uPosX, -0.85, 0.85, d.uPosX),
    uPosY: num(input.uPosY, -0.85, 0.85, d.uPosY),
    uPosZ: num(input.uPosZ, -0.85, 0.85, d.uPosZ),
    _scale: num(input._scale, 0.25, 2.5, d._scale),
    bgColor: sanitizeHex(
      input.bgColor ?? input.bgTop ?? input.bgBottom,
      d.bgColor,
    ),
  }
}

export function sanitizeUniformSnapshot(u: Partial<SculptUniformSnapshot>): SculptUniformSnapshot {
  const base = toUniformSnapshot(
    sanitizeSculptVisualSettings({ ...DEFAULT_SCULPT_VISUAL, ...u } as LoadedVisualSlice),
  )
  return { ...base, ...sanitizeScene4UniformSlice(u) }
}

export function toUniformSnapshot(v: SculptVisualSettings): SculptUniformCore {
  const { bgColor: _bg, ...u } = v
  return u
}
