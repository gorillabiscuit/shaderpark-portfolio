import { describe, expect, it } from 'vitest'
import { sculptSourceForLowQuality, sculptSourceForPreset, sculptSourceForScene } from '@/lib/shaderParkRenderSettings'

describe('sculptSourceForScene', () => {
  it('scene 1 is torus composition', () => {
    const src = sculptSourceForScene(1)
    expect(src).toContain('setGeometryQuality(12)')
    expect(src).toContain('torus(outerR, outerTube)')
  })

  it('scene 2 is three shells on X Y Z axes, blend(mergeK)', () => {
    const src = sculptSourceForScene(2)
    expect(src).toContain('setGeometryQuality(12)')
    expect(src).toContain('difference()')
    expect((src.match(/blend\(mergeK\)/g) ?? []).length).toBe(2)
    expect(src).toContain('var mergeK = add(0.05, mult(0.22, overlap))')
    expect(src).toContain('rotateY(mult(0.5, PI))')
    expect(src).toContain('rotateZ(mult(0.5, PI))')
    expect(src).toContain('mult(mult(s2ProgRotScale, 0.96), nsin(mult(0.53, time)))')
    expect(src).toContain('var s2ProgRotScale = 0.6')
    expect(src).toContain('mult(s2ProgRotScale, 1.48)')
    expect(src).toContain('sphere(ringOuter)')
    expect(src).toContain('sphere(ringInner)')
    expect(src).toContain('box(cutHalfX, cutHalfY, cutHalfZ)')
    expect(src).toContain('slabGap')
    expect(src).toContain('blueCenterX')
    expect(src).toContain('greenCenterX')
    expect(src).not.toContain('torus(outerR, outerTube)')
  })

  it('scene 3 is palette slab + glslFuncES3 sample', () => {
    const src = sculptSourceForScene(3)
    expect(src).toContain('setGeometryQuality(12)')
    expect(src).toContain('spScene3Sample')
    expect(src).toContain('spScene3Palette')
    expect(src).toContain('lightDirection(0.4, 0.55, 0.52)')
    expect(src).toContain('displace(0, 0, uPosZ)')
    expect(src).toContain('sin(mouse.x * 2.52) * phi + 3.0 * sin(mouse.y * 3.14159265)')
    expect(src).toContain('uSp3IdleA1Amp * sin(time * uSp3IdleA1Time)')
    expect(src).toContain('vec3(uSp3Pal0R, uSp3Pal0G, uSp3Pal0B)')
    expect(src).toContain('box(5.0, 5.0, 0.01)')
    expect(src).toContain('color(spScene3Rgb(getSpace()))')
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
