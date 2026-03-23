import type { BackgroundAppearanceMode } from '@/config/backgroundTheme'

export type Scene4Rgb = { r: number; g: number; b: number }
export type Scene4Palette = [Scene4Rgb, Scene4Rgb, Scene4Rgb, Scene4Rgb]
export type Scene4PaletteByTheme = Record<BackgroundAppearanceMode, Scene4Palette>

export type Scene4UniformSlice = {
  uS4Pal0R: number
  uS4Pal0G: number
  uS4Pal0B: number
  uS4Pal1R: number
  uS4Pal1G: number
  uS4Pal1B: number
  uS4Pal2R: number
  uS4Pal2G: number
  uS4Pal2B: number
  uS4Pal3R: number
  uS4Pal3G: number
  uS4Pal3B: number
}

const clamp01 = (x: unknown, fb: number) => {
  const v = typeof x === 'number' ? x : Number(x)
  if (!Number.isFinite(v)) return fb
  return Math.max(0, Math.min(1, v))
}

export const DEFAULT_SCENE4_PALETTE_BY_THEME: Scene4PaletteByTheme = {
  dark: [
    { r: 0.5, g: 0.52, b: 0.53 },
    { r: 0.46, g: 0.22, b: 0.35 },
    { r: 0.82, g: 0.84, b: 0.65 },
    { r: 0.53, g: 0.23, b: 0.22 },
  ],
  light: [
    { r: 0.66, g: 0.68, b: 0.69 },
    { r: 0.44, g: 0.36, b: 0.45 },
    { r: 0.9, g: 0.91, b: 0.78 },
    { r: 0.62, g: 0.42, b: 0.4 },
  ],
}

function sanitizeRgb(x: unknown, fb: Scene4Rgb): Scene4Rgb {
  const obj = (x ?? {}) as Partial<Scene4Rgb>
  return {
    r: clamp01(obj.r, fb.r),
    g: clamp01(obj.g, fb.g),
    b: clamp01(obj.b, fb.b),
  }
}

function sanitizePalette(x: unknown, fb: Scene4Palette): Scene4Palette {
  const arr = Array.isArray(x) ? x : []
  return [
    sanitizeRgb(arr[0], fb[0]),
    sanitizeRgb(arr[1], fb[1]),
    sanitizeRgb(arr[2], fb[2]),
    sanitizeRgb(arr[3], fb[3]),
  ]
}

export function sanitizeScene4PaletteByTheme(raw: unknown): Scene4PaletteByTheme {
  const o = (raw ?? {}) as Partial<Scene4PaletteByTheme>
  return {
    dark: sanitizePalette(o.dark, DEFAULT_SCENE4_PALETTE_BY_THEME.dark),
    light: sanitizePalette(o.light, DEFAULT_SCENE4_PALETTE_BY_THEME.light),
  }
}

export function scene4PaletteToUniformSlice(p: Scene4Palette): Scene4UniformSlice {
  return {
    uS4Pal0R: p[0].r,
    uS4Pal0G: p[0].g,
    uS4Pal0B: p[0].b,
    uS4Pal1R: p[1].r,
    uS4Pal1G: p[1].g,
    uS4Pal1B: p[1].b,
    uS4Pal2R: p[2].r,
    uS4Pal2G: p[2].g,
    uS4Pal2B: p[2].b,
    uS4Pal3R: p[3].r,
    uS4Pal3G: p[3].g,
    uS4Pal3B: p[3].b,
  }
}

export function sanitizeScene4UniformSlice(
  partial: Partial<Scene4UniformSlice>,
): Scene4UniformSlice {
  const fb = scene4PaletteToUniformSlice(DEFAULT_SCENE4_PALETTE_BY_THEME.dark)
  const out = { ...fb }
  for (const k of Object.keys(fb) as (keyof Scene4UniformSlice)[]) {
    out[k] = clamp01(partial[k], fb[k])
  }
  return out
}
