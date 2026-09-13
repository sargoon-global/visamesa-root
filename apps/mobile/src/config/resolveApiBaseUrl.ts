import { API_BASE_URL as PRODUCTION_API_BASE_URL } from '@visamesa/content/site'
import { Platform } from 'react-native'

const DEV_API_BASE_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
})!

export function assertHttpsProductionUrl(url: string): string {
  const normalized = url.trim().replace(/\/+$/, '')

  if (!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(normalized)) {
    throw new Error(
      `Invalid production API_BASE_URL "${url}". Expected https origin without trailing slash.`,
    )
  }

  return normalized
}

/**
 * Resolves the API origin for the current build.
 * - Dev/simulator: localhost (platform-specific).
 * - Release: {@link PRODUCTION_API_BASE_URL} from `@visamesa/content/site` (single source of truth).
 */
export function resolveApiBaseUrl(isDev = __DEV__): string {
  if (isDev) {
    return DEV_API_BASE_URL
  }

  return assertHttpsProductionUrl(PRODUCTION_API_BASE_URL)
}
