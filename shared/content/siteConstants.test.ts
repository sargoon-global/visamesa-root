import { describe, expect, it } from 'vitest'

import { API_BASE_URL, SITE_URL } from './siteConstants.js'

describe('siteConstants', () => {
  it('exposes production site and API origins without trailing slashes', () => {
    expect(SITE_URL).toBe('https://visamesa.com')
    expect(API_BASE_URL).toBe('https://api.visamesa.com')
    expect(SITE_URL.endsWith('/')).toBe(false)
    expect(API_BASE_URL.endsWith('/')).toBe(false)
  })
})
