import type { ViewportBreakpointId } from '@/lib/viewportBreakpoint'
import { VIEWPORT_BREAKPOINT_ORDER } from '@/lib/viewportBreakpoint'

/** Uniforms passed to shader-park `updateUniforms` (must match `input()` names in background sculpt + `_scale`). */
export type SculptUniformSnapshot = {
  uMatR: number
  uMatG: number
  uMatB: number
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
  'uMatR' | 'uMatG' | 'uMatB' | 'uMetal' | 'uShine' | 'uBallMetal' | 'bgColor'
>

export const SCULPT_CLIPBOARD_VERSION = 2 as const

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
      uMetal: src.uMetal,
      uShine: src.uShine,
      uBallMetal: src.uBallMetal,
      bgColor: src.bgColor,
    },
    perBreakpoint,
  }
}

export function defaultPerBreakpointSettings(): PerBreakpointSculptSettings {
  const row = {} as PerBreakpointSculptSettings
  for (const id of VIEWPORT_BREAKPOINT_ORDER) {
    row[id] = { ...DEFAULT_SCULPT_VISUAL }
  }
  return row
}

const STORAGE_KEY = 'shader-park-sculpt-panel-v1'

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

export function loadPerBreakpointSettings(): PerBreakpointSculptSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PerBreakpointSculptSettings>
    const base = defaultPerBreakpointSettings()
    for (const id of VIEWPORT_BREAKPOINT_ORDER) {
      const slice = parsed[id]
      if (slice && typeof slice === 'object') {
        base[id] = sanitizeSculptVisualSettings({ ...DEFAULT_SCULPT_VISUAL, ...slice })
      }
    }
    return base
  } catch {
    return null
  }
}

export function savePerBreakpointSettings(data: PerBreakpointSculptSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota */
  }
}

export function toUniformSnapshot(v: SculptVisualSettings): SculptUniformSnapshot {
  const { bgColor: _bg, ...u } = v
  return u
}
