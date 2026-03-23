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

  it('scene 3 is literal original phase palette slab snippet', () => {
    const src = sculptSourceForScene(3)
    expect(src).toContain('setGeometryQuality(12)')
    expect(src).toContain('let s = getSpace();')
    expect(src).toContain('const complexDiv = (a, b) => {')
    expect(src).toContain('function palette(t, a, b, c, d)')
    expect(src).toContain('const lineCount = 9.0;')
    expect(src).toContain('0.35 * i * sin(time * 0.9)')
    expect(src).toContain('sin(time * 0.84) * phi + 3.0 * sin(time)')
    expect(src).toContain('vec3(0.50, 0.52, 0.53)')
    expect(src).toContain('vec3(0.53, 0.23, 0.22)')
    expect(src).toContain('color(v);')
    expect(src).toContain('box(vec3(5.0, 5.0, 0.01));')
    expect(src).not.toContain('uSp3Pal')
    expect(src).not.toContain('displace(0, 0, uPosZ)')
    expect(src).not.toContain('torus(outerR, outerTube)')
  })

  it('scene 4 uses four concentric ring phase stack (not nine slits)', () => {
    const src3 = sculptSourceForScene(3)
    const src4 = sculptSourceForScene(4)
    expect(src4).toContain('setGeometryQuality(12)')
    expect(src4).toContain('const ringCount = 4.0;')
    expect(src4).toContain('const mx = mouse.x * 0.95;')
    expect(src4).toContain('const my = mouse.y * 0.75;')
    expect(src4).toContain('const r = sqrt(s.x * s.x + s.y * s.y);')
    expect(src4).toContain('lightDirection(0.42 + mx * 0.22, 0.52 + my * 0.2, 0.5);')
    expect(src4).toContain('fresnel(0.12 + abs(mx) * 0.16 + abs(my) * 0.14);')
    expect(src4).toContain('const dr = r - ri;')
    expect(src4).toContain('const tm = time * 0.5;')
    expect(src4).not.toContain('const lineCount = 9.0;')
    expect(src4).toContain('box(vec3(5.0, 5.0, 0.01));')
    expect(src4).toContain('var uS4Pal0R = input(0.50, 0, 1);')
    expect(src4).toContain('vec3(uS4Pal0R, uS4Pal0G, uS4Pal0B)')
    expect(src4).not.toContain('torus(outerR, outerTube)')
    expect(src4).not.toBe(src3)
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
