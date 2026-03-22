import type { SculptVisualSettings } from '@/lib/sculptControls'

/**
 * Background + sculpt defaults for each site appearance.
 * Material + `bgColor` here are **global per theme**: they merge on top of `DEFAULT_SCULPT_VISUAL`
 * for **every** viewport tier. Only position / `_scale` differ per breakpoint
 * (`DEFAULT_PER_BREAKPOINT_TRANSFORM_OVERRIDES` + stored `transforms`); see `defaultPerBreakpointForTheme`
 * and `buildPerBreakpointForTheme` in `sculptControls.ts`.
 */
export type BackgroundAppearanceMode = 'dark' | 'light'

export const DARK_BACKGROUND_BG = '#0e1629'
export const LIGHT_BACKGROUND_BG = '#ebebeb'

/** Partial overrides per appearance (merged on `DEFAULT_SCULPT_VISUAL`). */
export const BACKGROUND_THEME_SEED: Record<
  BackgroundAppearanceMode,
  Partial<SculptVisualSettings>
> = {
  dark: {
    bgColor: DARK_BACKGROUND_BG,
  },
  light: {
    bgColor: LIGHT_BACKGROUND_BG,
    uMatR: 0.8156862745098039,
    uMatG: 0.9725490196078431,
    uMatB: 0.050980392156862744,
    uHueShift: 0,
    uSat: 1,
    uValue: 0.96,
    uContrast: 1.06,
    uAmbient: 0,
    uRim: 0.06,
    uMetal: 0.77,
    uShine: 0.62,
    uBallMetal: 0.76,
  },
}
