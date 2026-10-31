export const SUPPORTED_LANGUAGES = ['en', 'es', 'zh'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
}

export const LANGUAGE_NATIVE_NAMES = LANGUAGE_NAMES

export const LOCALE_STORAGE_KEY = 'visamesa_language'

export const LOCALE_OG_MAP: Record<SupportedLanguage, string> = {
  en: 'en_GB',
  es: 'es_ES',
  zh: 'zh_CN',
}

export type TranslationNamespace =
  | 'common'
  | 'marketing'
  | 'checkout'
  | 'legal'
  | 'tieSteps'
  | 'dashboard'
  | 'forms'
  | 'profile'
  | 'settings'
  | 'support'
  | 'auth'
  | 'home'
  | 'processOverview'

export function isSupportedLanguage(lang: string | undefined | null): lang is SupportedLanguage {
  return lang != null && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
}

export function normalizeLanguageTag(tag: string | undefined | null): SupportedLanguage {
  if (!tag) {
    return DEFAULT_LANGUAGE
  }

  const normalized = tag.trim().toLowerCase().replace('_', '-')
  const primary = normalized.split('-')[0]

  if (primary === 'zh') {
    return 'zh'
  }

  return isSupportedLanguage(primary) ? primary : DEFAULT_LANGUAGE
}

export function localizedPath(path: string, locale: SupportedLanguage): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (locale === DEFAULT_LANGUAGE) {
    return normalizedPath
  }

  if (normalizedPath === '/') {
    return `/${locale}`
  }

  return `/${locale}${normalizedPath}`
}

export function stripLocaleFromPath(pathname: string): {
  locale: SupportedLanguage
  path: string
} {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return { locale: DEFAULT_LANGUAGE, path: '/' }
  }

  const maybeLocale = segments[0]

  if (isSupportedLanguage(maybeLocale)) {
    const rest = segments.slice(1).join('/')
    return {
      locale: maybeLocale,
      path: rest ? `/${rest}` : '/',
    }
  }

  return {
    locale: DEFAULT_LANGUAGE,
    path: pathname.startsWith('/') ? pathname : `/${pathname}`,
  }
}
