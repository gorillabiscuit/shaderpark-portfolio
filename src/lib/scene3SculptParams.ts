/**
 * Scene 3 (palette slab) — palette colours and idle-motion coefficients.
 * Stored once in sculpt localStorage; flattened to `input()` uniforms in the sculpt source.
 */

export type Scene3Rgb = { r: number; g: number; b: number }

export type Scene3IdleParams = {
  phiAmp: number
  phiTime: number
  phiPerLine: number
  a1Amp: number
  a1Time: number
  a2Amp: number
  a2Time: number
  a2Phi: number
  a3Amp: number
  a3Time: number
  a3Px: number
  a3Py: number
}

export type Scene3Params = {
  palette: [Scene3Rgb, Scene3Rgb, Scene3Rgb, Scene3Rgb]
  idle: Scene3IdleParams
}

export const DEFAULT_SCENE3_PARAMS: Scene3Params = {
  palette: [
    { r: 0.5, g: 0.52, b: 0.53 },
    { r: 0.46, g: 0.22, b: 0.35 },
    { r: 0.82, g: 0.84, b: 0.65 },
    { r: 0.53, g: 0.23, b: 0.22 },
  ],
  idle: {
    phiAmp: 0.38,
    phiTime: 0.52,
    phiPerLine: 0.55,
    a1Amp: 1.15,
    a1Time: 0.48,
    a2Amp: 0.88,
    a2Time: 0.67,
    a2Phi: 0.28,
    a3Amp: 0.52,
    a3Time: 0.58,
    a3Px: 0.22,
    a3Py: 0.17,
  },
}

/** Uniform names must match `var … = input(…)` in `backgroundSculpt.ts` scene 3. */
export type Scene3UniformSlice = {
  uSp3Pal0R: number
  uSp3Pal0G: number
  uSp3Pal0B: number
  uSp3Pal1R: number
  uSp3Pal1G: number
  uSp3Pal1B: number
  uSp3Pal2R: number
  uSp3Pal2G: number
  uSp3Pal2B: number
  uSp3Pal3R: number
  uSp3Pal3G: number
  uSp3Pal3B: number
  uSp3IdlePhiAmp: number
  uSp3IdlePhiTime: number
  uSp3IdlePhiPerLine: number
  uSp3IdleA1Amp: number
  uSp3IdleA1Time: number
  uSp3IdleA2Amp: number
  uSp3IdleA2Time: number
  uSp3IdleA2Phi: number
  uSp3IdleA3Amp: number
  uSp3IdleA3Time: number
  uSp3IdleA3Px: number
  uSp3IdleA3Py: number
}

function num(x: unknown, lo: number, hi: number, fb: number): number {
  const v = typeof x === 'number' ? x : Number(x)
  if (!Number.isFinite(v)) return fb
  return Math.min(hi, Math.max(lo, v))
}

function sanitizeRgb(x: unknown, fb: Scene3Rgb): Scene3Rgb {
  if (!x || typeof x !== 'object') return { ...fb }
  const o = x as Record<string, unknown>
  return {
    r: num(o.r, 0, 1, fb.r),
    g: num(o.g, 0, 1, fb.g),
    b: num(o.b, 0, 1, fb.b),
  }
}

export function sanitizeScene3Params(raw: unknown): Scene3Params {
  const d = DEFAULT_SCENE3_PARAMS
  let palette: [Scene3Rgb, Scene3Rgb, Scene3Rgb, Scene3Rgb] = [...d.palette]
  if (raw && typeof raw === 'object' && 'palette' in raw) {
    const p = (raw as { palette?: unknown }).palette
    if (Array.isArray(p) && p.length >= 4) {
      palette = [
        sanitizeRgb(p[0], d.palette[0]),
        sanitizeRgb(p[1], d.palette[1]),
        sanitizeRgb(p[2], d.palette[2]),
        sanitizeRgb(p[3], d.palette[3]),
      ]
    }
  }
  const idleIn =
    raw && typeof raw === 'object' && 'idle' in raw && (raw as { idle?: unknown }).idle
      ? ((raw as { idle: Record<string, unknown> }).idle ?? {})
      : {}
  const id = d.idle
  const idle: Scene3IdleParams = {
    phiAmp: num(idleIn.phiAmp, 0, 3, id.phiAmp),
    phiTime: num(idleIn.phiTime, 0, 4, id.phiTime),
    phiPerLine: num(idleIn.phiPerLine, 0, 4, id.phiPerLine),
    a1Amp: num(idleIn.a1Amp, 0, 4, id.a1Amp),
    a1Time: num(idleIn.a1Time, 0, 4, id.a1Time),
    a2Amp: num(idleIn.a2Amp, 0, 4, id.a2Amp),
    a2Time: num(idleIn.a2Time, 0, 4, id.a2Time),
    a2Phi: num(idleIn.a2Phi, 0, 4, id.a2Phi),
    a3Amp: num(idleIn.a3Amp, 0, 4, id.a3Amp),
    a3Time: num(idleIn.a3Time, 0, 4, id.a3Time),
    a3Px: num(idleIn.a3Px, 0, 4, id.a3Px),
    a3Py: num(idleIn.a3Py, 0, 4, id.a3Py),
  }
  return { palette, idle }
}

export function scene3ParamsToUniformSlice(p: Scene3Params): Scene3UniformSlice {
  const [a, b, c, d] = p.palette
  const i = p.idle
  return {
    uSp3Pal0R: a.r,
    uSp3Pal0G: a.g,
    uSp3Pal0B: a.b,
    uSp3Pal1R: b.r,
    uSp3Pal1G: b.g,
    uSp3Pal1B: b.b,
    uSp3Pal2R: c.r,
    uSp3Pal2G: c.g,
    uSp3Pal2B: c.b,
    uSp3Pal3R: d.r,
    uSp3Pal3G: d.g,
    uSp3Pal3B: d.b,
    uSp3IdlePhiAmp: i.phiAmp,
    uSp3IdlePhiTime: i.phiTime,
    uSp3IdlePhiPerLine: i.phiPerLine,
    uSp3IdleA1Amp: i.a1Amp,
    uSp3IdleA1Time: i.a1Time,
    uSp3IdleA2Amp: i.a2Amp,
    uSp3IdleA2Time: i.a2Time,
    uSp3IdleA2Phi: i.a2Phi,
    uSp3IdleA3Amp: i.a3Amp,
    uSp3IdleA3Time: i.a3Time,
    uSp3IdleA3Px: i.a3Px,
    uSp3IdleA3Py: i.a3Py,
  }
}

export const DEFAULT_SCENE3_UNIFORM_SLICE: Scene3UniformSlice =
  scene3ParamsToUniformSlice(DEFAULT_SCENE3_PARAMS)

const PALETTE_KEYS: (keyof Scene3UniformSlice)[] = [
  'uSp3Pal0R',
  'uSp3Pal0G',
  'uSp3Pal0B',
  'uSp3Pal1R',
  'uSp3Pal1G',
  'uSp3Pal1B',
  'uSp3Pal2R',
  'uSp3Pal2G',
  'uSp3Pal2B',
  'uSp3Pal3R',
  'uSp3Pal3G',
  'uSp3Pal3B',
]

/** Merge partial uniform overrides; clamp to safe ranges for the GPU. */
export function sanitizeScene3UniformSlice(
  partial: Partial<Scene3UniformSlice>,
): Scene3UniformSlice {
  const d = DEFAULT_SCENE3_UNIFORM_SLICE
  const o = { ...d }
  for (const k of PALETTE_KEYS) {
    const v = partial[k]
    if (typeof v === 'number' && Number.isFinite(v)) o[k] = num(v, 0, 1, d[k])
  }
  const idleKeys: (keyof Scene3UniformSlice)[] = [
    'uSp3IdlePhiAmp',
    'uSp3IdlePhiTime',
    'uSp3IdlePhiPerLine',
    'uSp3IdleA1Amp',
    'uSp3IdleA1Time',
    'uSp3IdleA2Amp',
    'uSp3IdleA2Time',
    'uSp3IdleA2Phi',
    'uSp3IdleA3Amp',
    'uSp3IdleA3Time',
    'uSp3IdleA3Px',
    'uSp3IdleA3Py',
  ]
  for (const k of idleKeys) {
    const v = partial[k]
    if (typeof v === 'number' && Number.isFinite(v)) o[k] = num(v, 0, 6, d[k])
  }
  return o
}

export function mergeScene3Params(
  current: Scene3Params,
  patch: {
    palette?: Partial<Record<0 | 1 | 2 | 3, Partial<Scene3Rgb>>>
    idle?: Partial<Scene3IdleParams>
  },
): Scene3Params {
  const palette: [Scene3Rgb, Scene3Rgb, Scene3Rgb, Scene3Rgb] = [...current.palette]
  if (patch.palette) {
    for (const k of [0, 1, 2, 3] as const) {
      const row = patch.palette[k]
      if (row) palette[k] = { ...palette[k], ...row }
    }
  }
  return sanitizeScene3Params({
    palette,
    idle: { ...current.idle, ...patch.idle },
  })
}
