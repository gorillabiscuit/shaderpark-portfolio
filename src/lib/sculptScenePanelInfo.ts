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

/** Scene 3 `palette(t, a,b,c,d)` — hardcoded vec3s in GLSL (reference swatches). */
const SCENE_3_PALETTE: { label: string; rgb: [number, number, number] }[] = [
  { label: 'Palette a (offset)', rgb: [0.5, 0.52, 0.53] },
  { label: 'Palette b (cos amp)', rgb: [0.46, 0.22, 0.35] },
  { label: 'Palette c (freq)', rgb: [0.82, 0.84, 0.65] },
  { label: 'Palette d (phase)', rgb: [0.53, 0.23, 0.22] },
]

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
        label: 'Half-height sz',
        detail: '0.5 + nsin(time) × 0.2',
      },
      {
        label: 'φ per line (i = 0…8)',
        detail: 'strength × atan(q) + 0.35 × i × sin(time × 0.9); nine lines, spacing 0.22, strength 2',
      },
      {
        label: 'palette angle',
        detail: 'sin(time × 0.84) × (φ / 9) + 3 × sin(time)',
      },
      {
        label: 'Geometry',
        detail: 'Thin slab box 5×5×0.01; panel Z uses uPosZ only',
      },
    ],
  },
  4: {
    fabTitle: 'Palette',
    drawerHeading: 'Scene 4 — Concentric rings',
    colors: SCENE_3_PALETTE.map(({ label, rgb }) => ({ label, rgb })),
    idleMotion: [
      {
        label: 'Half-height sz',
        detail: '0.5 + nsin(0.5×time) × 0.2',
      },
      {
        label: 'φ per ring (i = 0…3)',
        detail:
          'r = √(x²+y²); dr = r − ri; same complexDiv/atan as scene 3 but radial; ri = 0.35 + i×0.55; + 0.35×i×sin(0.5×time×0.9)',
      },
      {
        label: 'palette angle',
        detail: 'sin(0.5×time × 0.84) × (φ / 4) + 3 × sin(0.5×time) — global half-speed',
      },
      {
        label: 'Geometry',
        detail: 'Thin slab box 5×5×0.01',
      },
    ],
    pointerMotion: [
      {
        label: 'Mouse → colour & light only',
        detail:
          'mx = 0.95×mouse.x, my = 0.75×mouse.y; rings stay fixed in space — mouse shifts palette phase, lightDirection, fresnel rim, metal/shine',
      },
    ],
  },
}

export function getSculptScenePanelCopy(sceneId: SculptSceneId): SculptScenePanelCopy {
  return COPY_BY_SCENE[sceneId]
}
