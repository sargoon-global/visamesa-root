import { sizes } from '@visamesa/design-tokens'
import { typography } from '@visamesa/design-tokens'

import { getBrandLogoDimensions } from './brandDimensions'

describe('getBrandLogoDimensions', () => {
  it('derives header sizes from design tokens', () => {
    const dims = getBrandLogoDimensions('header')

    expect(dims.mark.height).toBe(sizes.brand.markHeightDesktop)
    expect(dims.logotype.height).toBe(typography.labelLarge.fontSize)
    expect(dims.mark.width).toBeGreaterThan(dims.mark.height)
    expect(dims.logotype.width).toBeGreaterThan(dims.logotype.height)
  })

  it('derives hero sizes from design tokens', () => {
    const dims = getBrandLogoDimensions('hero')

    expect(dims.mark.height).toBe(sizes.brand.markHeightHero)
    expect(dims.logotype.height).toBe(typography.titleLarge.fontSize)
  })
})
