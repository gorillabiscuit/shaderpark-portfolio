import { describe, expect, it } from 'vitest'
import { compileSculptRaymarchConstants } from '@/lib/shaderParkRaymarchCompile'
import { sculptSourceForPreset } from '@/lib/shaderParkRenderSettings'

describe('compileSculptRaymarchConstants', () => {
  it('embeds different raymarch constants for low vs high presets', () => {
    const low = compileSculptRaymarchConstants(sculptSourceForPreset('low'))
    const high = compileSculptRaymarchConstants(sculptSourceForPreset('high'))
    expect(low.error).toBeUndefined()
    expect(high.error).toBeUndefined()
    expect(low.maxIterations).toBe(48)
    expect(high.maxIterations).toBe(420)
    expect(low.stepSizeConstant).toBeCloseTo(0.993, 5)
    expect(high.stepSizeConstant).toBe(0.85)
  })
})
