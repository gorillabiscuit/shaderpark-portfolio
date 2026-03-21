import {
  BACKGROUND_THEME_SEED,
  type BackgroundAppearanceMode,
} from '@/config/backgroundTheme'
import type { ViewportBreakpointId } from '@/lib/viewportBreakpoint'
import { VIEWPORT_BREAKPOINT_ORDER } from '@/lib/viewportBreakpoint'

/** Uniforms passed to shader-park `updateUniforms` (must match `input()` names in background sculpt + `_scale`). */
export type SculptUniformSnapshot = {
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

export type SculptVisualSettings = SculptUniformSnapshot & {
  /** Solid page / letterbox color (CSS). */
  bgColor: string
}

export const DEFAULT_SCULPT_VISUAL: SculptVisualSettings = {
  uMatR: 201 / 255,
  uMatG: 240 / 255,
  uMatB: 16 / 255,
  uHueShift: 0,
  uSat: 1,
  uValue: 1,
  uContrast: 1,
  uAmbient: 0,
  uRim: 0,
  uMetal: 0.52,
  uShine: 0.38,
  uBallMetal: 0.78,
  uPosX: 0,
  uPosY: 0,
  uPosZ: 0,
  _scale: 1,
  bgColor: '#0e0e12',
}

export type PerBreakpointSculptSettings = Record<ViewportBreakpointId, SculptVisualSettings>

/** Per breakpoint in clipboard: transform only. */
export type SculptPositionScaleSlice = Pick<
  SculptUniformSnapshot,
  'uPosX' | 'uPosY' | 'uPosZ' | '_scale'
>

export type PerBreakpointPositionScale = Record<ViewportBreakpointId, SculptPositionScaleSlice>

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

export const SCULPT_CLIPBOARD_VERSION = 3 as const

export type SculptClipboardPayload = {
  version: typeof SCULPT_CLIPBOARD_VERSION
  /** Which preset tab the `appearance` fields were taken from (when copying from the panel). */
  appearanceFromBreakpoint: ViewportBreakpointId
  appearance: SculptAppearanceClipboardSlice
  perBreakpoint: PerBreakpointPositionScale
}

/**
 * Clipboard JSON: one shared material + background (from `appearanceFromBreakpoint`), and
 * position + scale for every breakpoint.
 */
export function buildSculptClipboardPayload(
  per: PerBreakpointSculptSettings,
  appearanceFromBreakpoint: ViewportBreakpointId,
): SculptClipboardPayload {
  const src = per[appearanceFromBreakpoint]
  const perBreakpoint = {} as PerBreakpointPositionScale
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    const s = per[id]
    perBreakpoint[id] = {
      uPosX: s.uPosX,
      uPosY: s.uPosY,
      uPosZ: s.uPosZ,
      _scale: s._scale,
    }
  }
  return {
    version: SCULPT_CLIPBOARD_VERSION,
    appearanceFromBreakpoint,
    appearance: {
      uMatR: src.uMatR,
      uMatG: src.uMatG,
      uMatB: src.uMatB,
      uHueShift: src.uHueShift,
      uSat: src.uSat,
      uValue: src.uValue,
      uContrast: src.uContrast,
      uAmbient: src.uAmbient,
      uRim: src.uRim,
      uMetal: src.uMetal,
      uShine: src.uShine,
      uBallMetal: src.uBallMetal,
      bgColor: src.bgColor,
    },
    perBreakpoint,
  }
}

export function defaultPerBreakpointSettings(): PerBreakpointSculptSettings {
  return defaultPerBreakpointForTheme('dark')
}

export type SculptPanelsByTheme = Record<BackgroundAppearanceMode, PerBreakpointSculptSettings>

const STORAGE_KEY_LEGACY = 'shader-park-sculpt-panel-v1'
const STORAGE_KEY_V2 = 'shader-park-sculpt-panel-v2'

/** One breakpoint row: defaults + appearance seed (dark vs light plate). */
export function defaultSculptSliceForTheme(
  mode: BackgroundAppearanceMode,
): SculptVisualSettings {
  return sanitizeSculptVisualSettings({
    ...DEFAULT_SCULPT_VISUAL,
    ...BACKGROUND_THEME_SEED[mode],
  })
}

export function defaultPerBreakpointForTheme(
  mode: BackgroundAppearanceMode,
): PerBreakpointSculptSettings {
  const seed = defaultSculptSliceForTheme(mode)
  const row = {} as PerBreakpointSculptSettings
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    row[id] = { ...seed }
  }
  return row
}

function migrateLegacyV1ToDarkPanel(
  parsed: Partial<PerBreakpointSculptSettings>,
): PerBreakpointSculptSettings {
  const base = defaultPerBreakpointForTheme('dark')
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    const slice = parsed[id]
    if (slice && typeof slice === 'object') {
      base[id] = sanitizeSculptVisualSettings({
        ...DEFAULT_SCULPT_VISUAL,
        ...BACKGROUND_THEME_SEED.dark,
        ...slice,
      })
    }
  }
  return base
}

function hydrateThemePanel(
  raw: unknown,
  mode: BackgroundAppearanceMode,
): PerBreakpointSculptSettings {
  const base = defaultPerBreakpointForTheme(mode)
  if (!raw || typeof raw !== 'object') return base
  const o = raw as Partial<PerBreakpointSculptSettings>
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    const slice = o[id]
    if (slice && typeof slice === 'object') {
      base[id] = sanitizeSculptVisualSettings({
        ...DEFAULT_SCULPT_VISUAL,
        ...BACKGROUND_THEME_SEED[mode],
        ...slice,
      })
    }
  }
  return base
}

export function loadSculptPanelsByTheme(): SculptPanelsByTheme {
  try {
    const v2raw = localStorage.getItem(STORAGE_KEY_V2)
    if (v2raw) {
      const parsed = JSON.parse(v2raw) as { dark?: unknown; light?: unknown }
      return {
        dark: hydrateThemePanel(parsed.dark, 'dark'),
        light: hydrateThemePanel(parsed.light, 'light'),
      }
    }
    const v1raw = localStorage.getItem(STORAGE_KEY_LEGACY)
    if (v1raw) {
      const parsed = JSON.parse(v1raw) as Partial<PerBreakpointSculptSettings>
      const out: SculptPanelsByTheme = {
        dark: migrateLegacyV1ToDarkPanel(parsed),
        light: defaultPerBreakpointForTheme('light'),
      }
      try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(out))
        localStorage.removeItem(STORAGE_KEY_LEGACY)
      } catch {
        /* ignore */
      }
      return out
    }
  } catch {
    /* ignore */
  }
  return {
    dark: defaultPerBreakpointForTheme('dark'),
    light: defaultPerBreakpointForTheme('light'),
  }
}

export function saveSculptPanelsByTheme(data: SculptPanelsByTheme) {
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data))
  } catch {
    /* ignore quota */
  }
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

export function sanitizeUniformSnapshot(u: SculptUniformSnapshot): SculptUniformSnapshot {
  return toUniformSnapshot(
    sanitizeSculptVisualSettings({ ...DEFAULT_SCULPT_VISUAL, ...u }),
  )
}

export function toUniformSnapshot(v: SculptVisualSettings): SculptUniformSnapshot {
  const { bgColor: _bg, ...u } = v
  return u
}
