import { useEffect, useRef } from 'react'
import { sculptToMinimalRenderer } from 'shader-park-core'
import { installGlobalMouseForShaderParkCanvas } from '@/lib/shaderParkGlobalMouse'
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
}: ShaderParkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const uninstallGlobal =
      globalMouse ? installGlobalMouseForShaderParkCanvas(canvas) : () => {}

    sculptToMinimalRenderer(canvas, backgroundSculptSource)

    return () => {
      uninstallGlobal()
    }
  }, [globalMouse])

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'pointer-events-none block h-full w-full',
        variant === 'fullscreen' && 'fixed inset-0 -z-10',
        variant === 'inline' && 'absolute inset-0',
        className,
      )}
      aria-hidden={variant === 'fullscreen'}
    />
  )
}
