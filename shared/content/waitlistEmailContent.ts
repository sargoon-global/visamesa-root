import waitlistEn from './locales/en/waitlist.json' with { type: 'json' }
import waitlistEs from './locales/es/waitlist.json' with { type: 'json' }
import waitlistZh from './locales/zh/waitlist.json' with { type: 'json' }
import { renderEmailLayout, renderEmailText } from './email/emailLayout.js'
import { DEFAULT_LANGUAGE, localizedPath, normalizeLanguageTag, type SupportedLanguage } from './i18n/types.js'

export type WaitlistEmailContent = {
  subject: string
  preview: string
  greeting: string
  body: string
  cta: string
  signoff: string
  signoffName: string
  signoffRole: string
  footer: string
  footerReply: string
}

export type WaitlistConfirmationEmail = {
  subject: string
  html: string
  text: string
}

const WAITLIST_EMAIL_BY_LOCALE: Record<SupportedLanguage, WaitlistEmailContent> = {
  en: waitlistEn.email,
  es: waitlistEs.email,
  zh: waitlistZh.email,
}

const WAITLIST_EMAIL_CONTENT_KEYS: (keyof WaitlistEmailContent)[] = [
  'subject',
  'preview',
  'greeting',
  'body',
  'cta',
  'signoff',
  'signoffName',
  'signoffRole',
  'footer',
  'footerReply',
]

export function getWaitlistEmailContentKeys(): (keyof WaitlistEmailContent)[] {
  return [...WAITLIST_EMAIL_CONTENT_KEYS]
}

export function getWaitlistEmailContent(locale: string | undefined | null): WaitlistEmailContent {
  if (locale === 'es' || locale === 'zh') {
    return WAITLIST_EMAIL_BY_LOCALE[locale]
  }

  return WAITLIST_EMAIL_BY_LOCALE[DEFAULT_LANGUAGE]
}

export function buildWaitlistConfirmationEmail(input: {
  confirmationToken: string
  locale: string | undefined | null
  appUrl: string
}): WaitlistConfirmationEmail {
  const locale = normalizeLanguageTag(input.locale)
  const content = getWaitlistEmailContent(locale)
  const confirmPath = localizedPath(`/waitlist/confirm/${input.confirmationToken}`, locale)
  const confirmUrl = `${input.appUrl.replace(/\/$/, '')}${confirmPath}`

  const layoutInput = {
    locale,
    previewText: content.preview,
    heading: content.greeting,
    paragraphs: [content.body],
    cta: { label: content.cta, url: confirmUrl },
    signature: {
      farewell: content.signoff,
      name: content.signoffName,
      role: content.signoffRole,
    },
    footerNote: content.footer,
    replyHint: content.footerReply,
  }

  return {
    subject: content.subject,
    html: renderEmailLayout(layoutInput),
    text: renderEmailText(layoutInput),
  }
}
