/** Matches SpThreeVue hover smoothing: each frame ~ lerp(prev, target, 1 - hoverInterpolation). */
const POINTER_SMOOTH = 0.92

/**
 * shader-park-core's minimal renderer only listens to pointermove on the canvas.
 * We intercept that registration and feed synthetic events so the same uniform
 * math tracks the cursor across the whole viewport (like shaderpark.com).
 * NDC is exponentially smoothed (similar to their smoothed hover/click uniforms).
 */
export function installGlobalMouseForShaderParkCanvas(canvas: HTMLCanvasElement): () => void {
  const cleanups: (() => void)[] = []
  const origAdd = canvas.addEventListener.bind(canvas)
  let sx = 0
  let sy = 0
  let hasPointer = false

  canvas.addEventListener = ((
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    if (type === 'pointermove' && typeof listener === 'function') {
      const onWindow = (e: PointerEvent) => {
        const iw = window.innerWidth || 1
        const ih = window.innerHeight || 1
        const nx = (2 * e.clientX) / iw - 1
        const ny = 2 * (1 - e.clientY / ih) - 1
        if (!hasPointer) {
          sx = nx
          sy = ny
          hasPointer = true
        } else {
          const k = POINTER_SMOOTH
          sx = sx * k + nx * (1 - k)
          sy = sy * k + ny * (1 - k)
        }
        const dpr = window.devicePixelRatio || 1
        const w = canvas.width || 1
        const h = canvas.height || 1
        const ol = canvas.offsetLeft
        const ot = canvas.offsetTop
        const canvasX = ((sx + 1) / 2) * w
        const canvasY = (1 - (sy + 1) / 2) * h
        const pageX = ol + canvasX / dpr
        const pageY = ot + canvasY / dpr
        listener.call(canvas, { ...e, pageX, pageY } as unknown as Event)
      }
      window.addEventListener('pointermove', onWindow, { passive: true })
      cleanups.push(() => window.removeEventListener('pointermove', onWindow))
      return
    }
    return origAdd(type, listener, options)
  }) as typeof canvas.addEventListener

  return () => {
    canvas.addEventListener = origAdd
    for (const fn of cleanups) fn()
    cleanups.length = 0
  }
}
