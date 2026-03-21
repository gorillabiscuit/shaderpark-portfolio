declare module 'shader-park-core' {
  export function sculptToMinimalRenderer(
    canvas: HTMLCanvasElement,
    source: string | (() => void),
    updateUniforms?: () => Record<string, number | number[]>
  ): void

  export function sculptToGLSL(userProvidedSrc: string | (() => void)): unknown
  export function generatedGLSLToMinimalRenderer(
    canvas: HTMLCanvasElement,
    generatedGLSL: {
      uniforms: unknown
      stepSizeConstant: number
      maxIterations: number
      maxReflections: number
      geoGLSL: string
      colorGLSL: string
    },
    updateUniforms?: () => Record<string, number | number[]>
  ): void

  export function createSculpture(
    source: string | (() => void),
    uniformCallback?: () => Record<string, unknown>,
    params?: Record<string, unknown>,
    generatedGLSL?: unknown
  ): object
}
