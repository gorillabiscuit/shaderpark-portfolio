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
  /** Full Shader Park JS source; changing this recompiles and remounts the renderer. */
  sculptSource?: string
}

type CanvasWithDispose = HTMLCanvasElement & {
  __shaderParkDispose?: () => void
}

/**
 * shader-park-core minimal renderer has no public dispose; it registers `resize` and an endless
 * `requestAnimationFrame` chain. We patch RAF during init, capture `resize`, and on cleanup stop
 * the chain, remove listeners, and lose the WebGL context.
 */
function teardownShaderParkMinimalRenderer(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext | null,
  capturedResize: EventListener[],
  removeOverrides: () => void,
  uninstallGlobal: () => void,
  restoreRaf: () => void,
) {
  for (const fn of capturedResize) {
    try {
      window.removeEventListener('resize', fn)
    } catch {
      /* ignore */
    }
  }
  removeOverrides()
  uninstallGlobal()
  try {
    const lose = gl?.getExtension('WEBGL_lose_context')
    lose?.loseContext()
  } catch {
    /* ignore */
  }
  restoreRaf()
  const c = canvas as CanvasWithDispose
  if (c.__shaderParkDispose) {
    delete c.__shaderParkDispose
  }
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
  sculptSource = backgroundSculptSource,
}: ShaderParkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fallbackUniformsRef = useRef<SculptUniformSnapshot>(
    sanitizeUniformSnapshot(toUniformSnapshot(DEFAULT_SCULPT_VISUAL)),
  )
  const uniformsRef = uniformsRefProp ?? fallbackUniformsRef
  const embedClearRgbRef = useRef(hexToRgb01('#f4f4f2'))
  const clearRgbRef = clearRgbRefProp ?? embedClearRgbRef

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    const origRaf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      return origRaf((time: number) => {
        if (disposed) return
        cb(time)
      })
    }
    const restoreRaf = () => {
      window.requestAnimationFrame = origRaf
    }

    const capturedResize: EventListener[] = []
    const origWindowAdd = window.addEventListener.bind(window) as (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => void
    window.addEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === 'resize' && typeof listener === 'function') {
        capturedResize.push(listener)
      }
      return origWindowAdd(type, listener, options)
    }) as typeof window.addEventListener

    const uninstallGlobal = globalMouse
      ? installGlobalMouseForShaderParkCanvas(canvas, {
          ignorePointerRef: ignoreGlobalPointerRef,
        })
      : () => {}

    try {
      sculptToMinimalRenderer(canvas, sculptSource, () =>
        sanitizeUniformSnapshot(uniformsRef.current),
      )
    } catch (err) {
      disposed = true
      for (const fn of capturedResize) {
        try {
          window.removeEventListener('resize', fn)
        } catch {
          /* ignore */
        }
      }
      restoreRaf()
      uninstallGlobal()
      throw err
    } finally {
      window.addEventListener = origWindowAdd
    }

    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null
    const removeOverrides =
      gl != null
        ? installShaderParkMinimalRendererOverrides(gl, {
            clearRgbRef,
          })
        : () => {}

    let tornDown = false
    const dispose = () => {
      if (tornDown) return
      tornDown = true
      disposed = true
      teardownShaderParkMinimalRenderer(
        canvas,
        gl,
        capturedResize,
        removeOverrides,
        uninstallGlobal,
        restoreRaf,
      )
    }
    ;(canvas as CanvasWithDispose).__shaderParkDispose = dispose

    return () => {
      ;(canvas as CanvasWithDispose).__shaderParkDispose?.()
    }
  }, [globalMouse, uniformsRef, clearRgbRef, ignoreGlobalPointerRef, sculptSource])

  // Remount canvas when `sculptSource` changes: after WEBGL_lose_context the same element often
  // cannot acquire a new WebGL2 context, so `sculptToMinimalRenderer` would run on a dead surface.
  return (
    <canvas
      key={sculptSource}
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
