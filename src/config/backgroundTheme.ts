import type { SculptVisualSettings } from '@/lib/sculptControls'

/**
 * Background + sculpt defaults for each site appearance.
 * Values merge on top of `DEFAULT_SCULPT_VISUAL` for every breakpoint (see `defaultPerBreakpointForTheme`).
 */
export type BackgroundAppearanceMode = 'dark' | 'light'

export const DARK_BACKGROUND_BG = '#0e0e12'
export const LIGHT_BACKGROUND_BG = '#ebe9e4'

/** Partial overrides per appearance (palette + material tuned for the plate). */
export const BACKGROUND_THEME_SEED: Record<
  BackgroundAppearanceMode,
  Partial<SculptVisualSettings>
> = {
  dark: {
    bgColor: DARK_BACKGROUND_BG,
  },
  light: {
    bgColor: LIGHT_BACKGROUND_BG,
    uMatR: 0.72,
    uMatG: 0.52,
    uMatB: 0.06,
    uMetal: 0.48,
    uShine: 0.44,
    uBallMetal: 0.74,
    uContrast: 1.06,
    uValue: 0.96,
    uRim: 0.06,
  },
}
