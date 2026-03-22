import type { SculptSceneId } from '@/lib/shaderParkRenderSettings'

export type SceneColorSwatch = {
  label: string
  /** sRGB 0–1 */
  rgb: [number, number, number]
}

export type SceneMotionLine = {
  label: string
  detail: string
}

function rgb01ToHex(r: number, g: number, b: number): string {
  const to = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x * 255)))
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

export function sceneColorHex(rgb: [number, number, number]): string {
  return rgb01ToHex(rgb[0], rgb[1], rgb[2])
}

export type SculptScenePanelCopy = {
  fabTitle: string
  drawerHeading: string
  colors: SceneColorSwatch[]
  /** Automatic motion when time advances (shader `time`). */
  idleMotion: SceneMotionLine[]
  /** Optional: pointer-driven modulation. */
  pointerMotion?: SceneMotionLine[]
}

const SCENE_1_DEFAULT_MAT: [number, number, number] = [
  0.6235294117647059, 0.9411764705882353, 0.058823529411764705,
]

const SCENE_2_YELLOW: [number, number, number] = [1.0, 0.92, 0.08]

/** Scene 3 `palette(t, a,b,c,d)` — vectors a–d in GLSL (labels for the editable panel). */
const SCENE_3_PALETTE: { label: string; rgb: [number, number, number] }[] = [
  { label: 'Palette a (offset)', rgb: [0.5, 0.52, 0.53] },
  { label: 'Palette b (cos amp)', rgb: [0.46, 0.22, 0.35] },
  { label: 'Palette c (freq)', rgb: [0.82, 0.84, 0.65] },
  { label: 'Palette d (phase)', rgb: [0.53, 0.23, 0.22] },
]

/** Row labels for scene 3 palette colour pickers (order matches `palette` in storage). */
export const SCENE_3_PALETTE_ROW_LABELS: readonly string[] = SCENE_3_PALETTE.map((p) => p.label)

const COPY_BY_SCENE: Record<SculptSceneId, SculptScenePanelCopy> = {
  1: {
    fabTitle: 'Torus',
    drawerHeading: 'Scene 1 — Torus composition',
    colors: [
      {
        label: 'Material base (graded in shader; panel RGB)',
        rgb: SCENE_1_DEFAULT_MAT,
      },
    ],
    idleMotion: [
      { label: 'breatheA', detail: 'nsin(time × 0.85)' },
      { label: 'breatheB', detail: 'nsin(time × 1.35 + 1.2)' },
      { label: 'overlap', detail: 'breatheA × breatheB' },
      {
        label: 'blend mergeK',
        detail: '0.05 + 0.22 × overlap (smooth union of the three forms)',
      },
      {
        label: 'Radii / tubes',
        detail:
          'Outer & inner torus R/tube + centre sphere radius breathe with breatheA / breatheB / overlap',
      },
    ],
    pointerMotion: [
      {
        label: 'Mouse on rotations',
        detail: 'mx = 0.95×mouse.x, my = 0.75×mouse.y added to time on torus spins',
      },
    ],
  },
  2: {
    fabTitle: 'Rings',
    drawerHeading: 'Scene 2 — Three blended hollow shells',
    colors: [{ label: 'Shell albedo', rgb: SCENE_2_YELLOW }],
    idleMotion: [
      {
        label: 'breathe & mergeK',
        detail: 'Same as scene 1: nsin(0.85t), nsin(1.35t+1.2); mergeK = 0.05 + 0.22×overlap',
      },
      {
        label: 's2ProgRotScale',
        detail: '0.6 — scales every time×speed and nsin wobble amplitude on each axis',
      },
      {
        label: 'Wobble frequencies (examples)',
        detail: 'Per shell: nsin at 0.53, 0.41, 0.67 / 0.48, 0.71, 0.39 / 0.56, 0.62, 0.44 (rad/s scale on t)',
      },
    ],
    pointerMotion: [
      {
        label: 's2MouseInfluence',
        detail: '4.0 — scales s2Msx/s2Msy added to rotateX/Y/Z (incl. 0.55 mix on Z)',
      },
    ],
  },
  3: {
    fabTitle: 'Palette',
    drawerHeading: 'Scene 3 — Phase palette slab',
    colors: SCENE_3_PALETTE.map(({ label, rgb }) => ({ label, rgb })),
    idleMotion: [
      {
        label: 'φ per vertical slit (i = 0…5)',
        detail: '+ 0.38 × sin(time × 0.52 + i × 0.55)',
      },
      {
        label: 'palette angle — layer 1',
        detail: '+ 1.15 × sin(time × 0.48)',
      },
      {
        label: 'palette angle — layer 2',
        detail: '+ 0.88 × sin(time × 0.67 + φ × 0.28)',
      },
      {
        label: 'palette angle — layer 3',
        detail: '+ 0.52 × nsin(time × 0.58 + p.x×0.22 + p.y×0.17)',
      },
      {
        label: 'Geometry',
        detail: '6 slits, spacing 0.22, sz = 0.5, strength = 2 (fixed vertical extent)',
      },
    ],
    pointerMotion: [
      {
        label: 'φ mouse term',
        detail: '+ 0.35 × i × sin(mouse.x×0.95 + mouse.y×1.15) per line',
      },
      {
        label: 'angle mouse term',
        detail: 'sin(mouse.x×2.52)×φ + 3×sin(mouse.y×π)',
      },
      {
        label: 'Shading',
        detail: 'Fixed lightDirection (0.4, 0.55, 0.52); fresnel 0.35; metal 0.28; shine 0.58',
      },
    ],
  },
}

export function getSculptScenePanelCopy(sceneId: SculptSceneId): SculptScenePanelCopy {
  return COPY_BY_SCENE[sceneId]
}
