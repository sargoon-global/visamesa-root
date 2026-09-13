import { API_BASE_URL as PRODUCTION_API_BASE_URL } from '@visamesa/content/site'

import { assertHttpsProductionUrl, resolveApiBaseUrl } from './resolveApiBaseUrl'

describe('resolveApiBaseUrl', () => {
  it('returns shared production URL in release mode', () => {
    expect(resolveApiBaseUrl(false)).toBe(PRODUCTION_API_BASE_URL)
  })

  it('returns a localhost origin in dev mode', () => {
    const url = resolveApiBaseUrl(true)
    expect(url).toMatch(/^http:\/\/(localhost|10\.0\.2\.2):3000$/)
  })

  it('rejects invalid production URLs and normalizes trailing slashes', () => {
    expect(() => assertHttpsProductionUrl('http://api.visamesa.com')).toThrow(
      /Invalid production API_BASE_URL/,
    )
    expect(() => assertHttpsProductionUrl('not-a-url')).toThrow(/Invalid production API_BASE_URL/)
    expect(assertHttpsProductionUrl('https://api.visamesa.com/')).toBe('https://api.visamesa.com')
    expect(assertHttpsProductionUrl('https://api.visamesa.com')).toBe('https://api.visamesa.com')
  })
})
