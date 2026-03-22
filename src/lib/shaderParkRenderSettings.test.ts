import { describe, expect, it } from 'vitest'
import { sculptSourceForLowQuality, sculptSourceForPreset } from '@/lib/shaderParkRenderSettings'

describe('sculptSourceForLowQuality', () => {
  it('matches low preset numbers', () => {
    const src = sculptSourceForLowQuality()
    expect(src).toContain('setGeometryQuality(12)')
    expect(src).toContain('setMaxIterations(48)')
  })
})

describe('sculptSourceForPreset', () => {
  it('embeds preset numbers in source', () => {
    const low = sculptSourceForPreset('low')
    expect(low).toContain('setGeometryQuality(12)')
    expect(low).toContain('setMaxIterations(48)')
    const high = sculptSourceForPreset('high')
    expect(high).toContain('setGeometryQuality(88)')
    expect(high).toContain('setMaxIterations(420)')
  })
})
