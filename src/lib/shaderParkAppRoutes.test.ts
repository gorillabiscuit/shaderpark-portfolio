import { describe, expect, it } from 'vitest'
import {
  isAppMainShaderRoute,
  normalizeAppPathname,
} from '@/lib/shaderParkAppRoutes'

describe('normalizeAppPathname', () => {
  it('strips trailing slashes except root', () => {
    expect(normalizeAppPathname('/')).toBe('/')
    expect(normalizeAppPathname('//')).toBe('/')
    expect(normalizeAppPathname('/cv/')).toBe('/cv')
    expect(normalizeAppPathname('/d3-ai-guide/')).toBe('/d3-ai-guide')
  })
})

describe('isAppMainShaderRoute', () => {
  it('is true only for home', () => {
    expect(isAppMainShaderRoute('/')).toBe(true)
    expect(isAppMainShaderRoute('//')).toBe(true)
    expect(isAppMainShaderRoute('/cv')).toBe(false)
    expect(isAppMainShaderRoute('/nftfi')).toBe(false)
    expect(isAppMainShaderRoute('/embed')).toBe(false)
    expect(isAppMainShaderRoute('/d3-ai-guide')).toBe(false)
  })
})
