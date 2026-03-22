/**
 * Main app shell: load the fullscreen Shader Park dock only on home (`/`).
 * All other app paths (work, articles, CV, case studies, etc. — e.g. `/cv`, `/nftfi`,
 * `/cerebral`, `/nftfi-dataviz`, `/d3-ai-guide`) skip the lazy `AppShaderDock` bundle,
 * omit `ShaderParkBackground`, and rely on the solid plate from `SculptControlsProvider`.
 * `/embed` is excluded at the App shell (separate lazy canvas on `EmbedPage`).
 */
export function normalizeAppPathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/** True only when the main SPA should mount the lazy fullscreen minimal renderer. */
export function isAppMainShaderRoute(pathname: string): boolean {
  return normalizeAppPathname(pathname) === '/'
}
