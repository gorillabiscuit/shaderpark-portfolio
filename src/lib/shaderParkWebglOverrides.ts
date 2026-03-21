import type { MutableRefObject } from 'react'

/**
 * shader-park-core minimal renderer hard-codes white `gl.clearColor`. Patch `gl.clear` so the
 * buffer clear matches the chosen background (ray misses keep cleared pixels).
 */
export function installShaderParkMinimalRendererOverrides(
  gl: WebGL2RenderingContext,
  opts: {
    clearRgbRef: MutableRefObject<{ r: number; g: number; b: number }>
  },
): () => void {
  const { clearRgbRef } = opts

  const origClear = gl.clear.bind(gl)
  gl.clear = (mask: GLbitfield) => {
    if (mask & gl.COLOR_BUFFER_BIT) {
      const { r, g, b } = clearRgbRef.current
      gl.clearColor(r, g, b, 1)
    }
    return origClear(mask)
  }

  return () => {
    gl.clear = origClear
  }
}
