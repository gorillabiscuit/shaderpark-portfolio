import { buildBackgroundSculptSource, SCULPT_RAYMARCH_PRESETS } from '@/shader-park/backgroundSculpt'

export type SculptRenderPreset = keyof typeof SCULPT_RAYMARCH_PRESETS

export const SCULPT_RENDER_PRESETS = SCULPT_RAYMARCH_PRESETS

/** App and embed use the low raymarch tier only. */
export function sculptSourceForLowQuality(): string {
  return buildBackgroundSculptSource(SCULPT_RAYMARCH_PRESETS.low)
}

/** @deprecated use sculptSourceForLowQuality — presets are no longer user-selectable */
export function sculptSourceForPreset(preset: SculptRenderPreset): string {
  return buildBackgroundSculptSource(SCULPT_RAYMARCH_PRESETS[preset])
}
