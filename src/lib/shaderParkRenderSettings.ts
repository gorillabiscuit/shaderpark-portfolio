import {
  buildBackgroundSculptSource,
  buildScene2CircleSculptSource,
  buildScene3PaletteSculptSource,
  buildScene4PaletteSculptSource,
  SCULPT_RAYMARCH_PRESETS,
} from '@/shader-park/backgroundSculpt'

export type SculptRenderPreset = keyof typeof SCULPT_RAYMARCH_PRESETS

export const SCULPT_RENDER_PRESETS = SCULPT_RAYMARCH_PRESETS

export type SculptSceneId = 1 | 2 | 3 | 4

const low = SCULPT_RAYMARCH_PRESETS.low

/** App uses low raymarch tier; pick scene geometry. */
export function sculptSourceForScene(sceneId: SculptSceneId): string {
  if (sceneId === 2) return buildScene2CircleSculptSource(low)
  if (sceneId === 3) return buildScene3PaletteSculptSource(low)
  if (sceneId === 4) return buildScene4PaletteSculptSource(low)
  return buildBackgroundSculptSource(low)
}

/** @deprecated use sculptSourceForScene(1) */
export function sculptSourceForLowQuality(): string {
  return sculptSourceForScene(1)
}

/** @deprecated use sculptSourceForScene + preset helpers */
export function sculptSourceForPreset(preset: SculptRenderPreset): string {
  if (preset === 'low') return buildBackgroundSculptSource(SCULPT_RAYMARCH_PRESETS.low)
  return buildBackgroundSculptSource(SCULPT_RAYMARCH_PRESETS[preset])
}
