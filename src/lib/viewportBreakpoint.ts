/** Matches Tailwind v3 default `theme.screens` (min-width). */
export const TAILWIND_MIN_WIDTHS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type ViewportBreakpointId = 'base' | keyof typeof TAILWIND_MIN_WIDTHS

export const VIEWPORT_BREAKPOINT_ORDER: ViewportBreakpointId[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
]

export function activeViewportBreakpoint(width: number): ViewportBreakpointId {
  if (width >= TAILWIND_MIN_WIDTHS['2xl']) return '2xl'
  if (width >= TAILWIND_MIN_WIDTHS.xl) return 'xl'
  if (width >= TAILWIND_MIN_WIDTHS.lg) return 'lg'
  if (width >= TAILWIND_MIN_WIDTHS.md) return 'md'
  if (width >= TAILWIND_MIN_WIDTHS.sm) return 'sm'
  return 'base'
}

export function breakpointMinWidth(id: ViewportBreakpointId): number {
  if (id === 'base') return 0
  return TAILWIND_MIN_WIDTHS[id]
}
