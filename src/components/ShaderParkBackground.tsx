import { useEffect, useRef, type MutableRefObject } from 'react'
import { sculptToMinimalRenderer } from 'shader-park-core'
import { installGlobalMouseForShaderParkCanvas } from '@/lib/shaderParkGlobalMouse'
import {
  DEFAULT_SCULPT_VISUAL,
  hexToRgb01,
  sanitizeUniformSnapshot,
  toUniformSnapshot,
  type SculptUniformSnapshot,
} from '@/lib/sculptControls'
import { installShaderParkMinimalRendererOverrides } from '@/lib/shaderParkWebglOverrides'
import { backgroundSculptSource } from '@/shader-park/backgroundSculpt'
import { cn } from '@/lib/utils'

export type ShaderParkBackgroundVariant = 'fullscreen' | 'inline'

export type ShaderParkBackgroundProps = {
  /**
   * fullscreen: fixed behind the whole viewport (default).
   * inline: fills a positioned parent — set `position: relative` and a height on the wrapper
   * (e.g. `min-h-[min(420px,50vh)]` in a hero column).
   */
  variant?: ShaderParkBackgroundVariant
  className?: string
  /**
   * When true (default), pointer position is taken from **window** pointermove so the
   * sculpture follows the cursor anywhere on the page (same idea as shaderpark.com).
   * When false, uses stock shader-park-core behavior (only when moving over the canvas).
   */
  globalMouse?: boolean
  /**
   * When set, each frame reads this ref for `input()` uniforms and `_scale`.
   * Omit to use static defaults (e.g. embed).
   */
  uniformsRef?: MutableRefObject<SculptUniformSnapshot>
  /** When set, overrides hard-coded white `gl.clearColor` in shader-park minimal renderer. */
  clearRgbRef?: MutableRefObject<{ r: number; g: number; b: number }>
  /**
   * When `globalMouse` is on and this ref is `true`, viewport pointer moves are not forwarded
   * to the shader (mouse uniform stays at last value).
   */
  ignoreGlobalPointerRef?: MutableRefObject<boolean>
}

/**
 * WebGL2 sculpture via shader-park-core minimal renderer.
 *
 * **Mouse:** By default, `globalMouse` maps viewport position to the shader `mouse`
 * uniform on every `window` `pointermove`, so motion tracks the cursor across the whole
 * site while the canvas stays `pointer-events-none` for UI hit-testing.
 *
 * **Embedding:** For sharp GL in a narrow column, prefer an **iframe** to `/embed`
 * (`window` = iframe size).
 */
export function ShaderParkBackground({
  variant = 'fullscreen',
  className,
  globalMouse = true,
  uniformsRef: uniformsRefProp,
  clearRgbRef: clearRgbRefProp,
  ignoreGlobalPointerRef,
}: ShaderParkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fallbackUniformsRef = useRef<SculptUniformSnapshot>(
    toUniformSnapshot(DEFAULT_SCULPT_VISUAL),
  )
  const uniformsRef = uniformsRefProp ?? fallbackUniformsRef
  const embedClearRgbRef = useRef(hexToRgb01('#f4f4f2'))
  const clearRgbRef = clearRgbRefProp ?? embedClearRgbRef

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const uninstallGlobal = globalMouse
      ? installGlobalMouseForShaderParkCanvas(canvas, {
          ignorePointerRef: ignoreGlobalPointerRef,
        })
      : () => {}

    sculptToMinimalRenderer(canvas, backgroundSculptSource, () => {
      const u = sanitizeUniformSnapshot(uniformsRef.current)
      return {
        uMatR: u.uMatR,
        uMatG: u.uMatG,
        uMatB: u.uMatB,
        uHueShift: u.uHueShift,
        uSat: u.uSat,
        uValue: u.uValue,
        uContrast: u.uContrast,
        uAmbient: u.uAmbient,
        uRim: u.uRim,
        uMetal: u.uMetal,
        uShine: u.uShine,
        uBallMetal: u.uBallMetal,
        uPosX: u.uPosX,
        uPosY: u.uPosY,
        uPosZ: u.uPosZ,
        _scale: u._scale,
      }
    })

    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null
    const removeOverrides =
      gl != null
        ? installShaderParkMinimalRendererOverrides(gl, {
            clearRgbRef,
          })
        : () => {}

    return () => {
      removeOverrides()
      uninstallGlobal()
    }
  }, [globalMouse, uniformsRef, clearRgbRef, ignoreGlobalPointerRef])

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'pointer-events-none block h-full w-full',
        variant === 'fullscreen' && 'fixed inset-0 z-[1]',
        variant === 'inline' && 'absolute inset-0',
        className,
      )}
      aria-hidden={variant === 'fullscreen'}
    />
  )
}
