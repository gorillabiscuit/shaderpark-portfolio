import { describe, expect, it } from 'vitest'
import { sculptSourceForLowQuality, sculptSourceForPreset, sculptSourceForScene } from '@/lib/shaderParkRenderSettings'

describe('sculptSourceForScene', () => {
  it('scene 1 is torus composition', () => {
    const src = sculptSourceForScene(1)
    expect(src).toContain('setGeometryQuality(12)')
    expect(src).toContain('torus(outerR, outerTube)')
  })

  it('scene 2 is a sphere', () => {
    const src = sculptSourceForScene(2)
    expect(src).toContain('setGeometryQuality(12)')
    expect(src).toContain('sphere(0.38)')
    expect(src).not.toContain('torus(outerR, outerTube)')
  })
})

describe('sculptSourceForLowQuality', () => {
  it('matches scene 1 low preset numbers', () => {
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
