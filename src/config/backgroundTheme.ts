import type { SculptVisualSettings } from '@/lib/sculptControls'

/**
 * Background + sculpt defaults for each site appearance.
 * Values merge on top of `DEFAULT_SCULPT_VISUAL` for every breakpoint (see `defaultPerBreakpointForTheme`).
 */
export type BackgroundAppearanceMode = 'dark' | 'light'

export const DARK_BACKGROUND_BG = '#0e0e12'
export const LIGHT_BACKGROUND_BG = '#d4d4d4'

/** Partial overrides per appearance (plate color; material lives in `DEFAULT_SCULPT_VISUAL`). */
export const BACKGROUND_THEME_SEED: Record<
  BackgroundAppearanceMode,
  Partial<SculptVisualSettings>
> = {
  dark: {
    bgColor: DARK_BACKGROUND_BG,
  },
  light: {
    bgColor: LIGHT_BACKGROUND_BG,
  },
}
