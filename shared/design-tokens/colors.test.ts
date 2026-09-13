import { describe, expect, it } from 'vitest'

import { darkColors, lightColors } from './colors.js'

describe('brand color tokens', () => {
  it('uses red incomplete indicator in light theme', () => {
    expect(lightColors.incomplete).toBe('#D82020')
  })

  it('uses teal secondary for done/completed UI in light theme', () => {
    expect(lightColors.secondary).toBe('#00C49F')
    expect(lightColors.onSecondary).toBe('#FFFFFF')
    expect(lightColors.secondaryContainer).toBe('#B2F0E4')
    expect(lightColors.secondaryContainerSubtle).toBe('#E8FAF6')
    expect(lightColors.onSecondaryContainer).toBe('#00251F')
    expect(lightColors.secondaryContainer).not.toBe('#FFE8DE')
    expect(lightColors.secondaryContainer).not.toBe('#D4EDDA')
  })

  it('uses teal secondary across dark theme', () => {
    expect(darkColors.secondary).toMatch(/^#[0-9A-F]{6}$/i)
    expect(darkColors.secondaryContainer).toMatch(/^#[0-9A-F]{6}$/i)
    expect(darkColors.secondary).not.toBe('#FFB59D')
    expect(darkColors.secondaryContainer).not.toBe('#832600')
  })
})
