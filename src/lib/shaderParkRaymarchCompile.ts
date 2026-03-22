import { sculptToGLSL } from 'shader-park-core'

/** Subset of `sculptToGLSL` output used for raymarch (see shader-park-core `fragToMinimalRenderer`). */
export type SculptCompiledRaymarch = {
  maxIterations: number
  stepSizeConstant: number
  error?: string
}

/**
 * Reads the raymarch constants shader-park-core will embed (same pass as WebGL compile).
 * Heavy (uses eval internally) — call only for debug UI, and prefer when the sculpt panel is open.
 */
export function compileSculptRaymarchConstants(source: string): SculptCompiledRaymarch {
  const out = sculptToGLSL(source) as SculptCompiledRaymarch & { error?: string }
  return {
    maxIterations: out.maxIterations,
    stepSizeConstant: out.stepSizeConstant,
    error: out.error,
  }
}
