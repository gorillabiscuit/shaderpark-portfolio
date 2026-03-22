/**
 * Full sculpt drawer: breakpoint tiers, GPU readout, copy + reset.
 * Only **www.wouterschreuders.com** uses the slim panel; localhost, previews, and other hosts get full debug.
 */
export function isFullSculptDebugHost(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname !== 'www.wouterschreuders.com'
}
