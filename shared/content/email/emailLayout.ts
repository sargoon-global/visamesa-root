import { lightColors } from '@visamesa/design-tokens/colors'

import { SITE_NAME, SITE_TAGLINE, SITE_URL, SUPPORT_EMAIL } from '../siteConstants.js'
import type { SupportedLanguage } from '../i18n/types.js'

export type EmailLayoutInput = {
  locale: SupportedLanguage
  previewText: string
  heading: string
  paragraphs: string[]
  cta?: { label: string; url: string }
  fallbackUrl?: string
  signature?: {
    farewell: string
    name: string
    role: string
  }
  footerNote: string
  replyHint?: string
}

const EMAIL_LOGO_URL = `${SITE_URL}/brand/logo-email.png`
const PREHEADER_PAD = '&zwnj;&nbsp;'.repeat(48)

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderParagraphsHtml(paragraphs: string[]): string {
  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${lightColors.onSurface};">${escapeHtml(paragraph)}</p>`,
    )
    .join('\n')
}

function renderCtaHtml(cta: { label: string; url: string }): string {
  const { primary, onPrimary } = lightColors
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 8px 0 28px;">
      <tr>
        <td align="center" bgcolor="${primary}" style="border-radius: 999px; mso-line-height-rule: exactly;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(cta.url)}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="f" fillcolor="${primary}">
            <w:anchorlock/>
            <center style="color:${onPrimary};font-family:Arial,sans-serif;font-size:16px;font-weight:600;">${escapeHtml(cta.label)}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${escapeHtml(cta.url)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: ${primary}; color: ${onPrimary}; font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 44px; text-decoration: none; padding: 0 24px; border-radius: 999px; mso-line-height-rule: exactly;">
            ${escapeHtml(cta.label)}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `.trim()
}

function renderSignatureHtml(signature: NonNullable<EmailLayoutInput['signature']>): string {
  return `
    <p style="margin: 24px 0 4px; font-size: 16px; line-height: 1.5; color: ${lightColors.onSurface};">${escapeHtml(signature.farewell)}</p>
    <p style="margin: 0 0 2px; font-size: 16px; line-height: 1.5; font-weight: 600; color: ${lightColors.onSurface};">${escapeHtml(signature.name)}</p>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.5; color: ${lightColors.onSurfaceVariant};">${escapeHtml(signature.role)}</p>
  `.trim()
}

export function renderEmailLayout(input: EmailLayoutInput): string {
  const { primary, onSurface, onSurfaceVariant, surface, background, outlineVariant } = lightColors

  const ctaBlock = input.cta ? renderCtaHtml(input.cta) : ''
  const signatureBlock = input.signature ? renderSignatureHtml(input.signature) : ''
  const fallbackBlock = input.fallbackUrl
    ? `<p style="margin: 16px 0 0; font-size: 12px; line-height: 1.5; color: ${onSurfaceVariant}; word-break: break-all;">${escapeHtml(input.fallbackUrl)}</p>`
    : ''
  const replyBlock = input.replyHint
    ? `<p style="margin: 12px 0 0; font-size: 13px; line-height: 1.5; color: ${onSurfaceVariant};">${escapeHtml(input.replyHint)} <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color: ${primary}; text-decoration: none;">${escapeHtml(SUPPORT_EMAIL)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="${escapeHtml(input.locale)}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(input.heading)}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1B1B1F !important; }
      .email-card { background-color: #303033 !important; }
      .email-text { color: #E3E2E6 !important; }
      .email-muted { color: #C5C6D0 !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: ${background};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
    ${escapeHtml(input.previewText)}${PREHEADER_PAD}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${background};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td class="email-card email-padding" style="background-color: ${surface}; border: 1px solid ${outlineVariant}; border-radius: 12px; padding: 32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="padding-bottom: 28px; background-color: #FFFFFF;">
                    <img src="${EMAIL_LOGO_URL}" width="160" height="17" alt="${escapeHtml(SITE_NAME)}" style="display: block; border: 0; outline: none; text-decoration: none;">
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 class="email-text" style="margin: 0 0 20px; font-family: Arial, sans-serif; font-size: 22px; line-height: 1.35; font-weight: 600; color: ${onSurface};">${escapeHtml(input.heading)}</h1>
                    ${renderParagraphsHtml(input.paragraphs)}
                    ${ctaBlock}
                    ${signatureBlock}
                    <p class="email-muted" style="margin: 0; font-size: 14px; line-height: 1.6; color: ${onSurfaceVariant};">${escapeHtml(input.footerNote)}</p>
                    ${fallbackBlock}
                    <hr style="border: none; border-top: 1px solid ${outlineVariant}; margin: 28px 0 16px;">
                    <p class="email-muted" style="margin: 0; font-size: 12px; line-height: 1.5; color: ${onSurfaceVariant};">${escapeHtml(SITE_NAME)} · ${escapeHtml(SITE_TAGLINE)}</p>
                    ${replyBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

export function renderEmailText(input: EmailLayoutInput): string {
  const lines: string[] = [input.heading, '']

  for (const paragraph of input.paragraphs) {
    lines.push(paragraph, '')
  }

  if (input.cta) {
    lines.push(`${input.cta.label}: ${input.cta.url}`, '')
  }

  if (input.signature) {
    lines.push(input.signature.farewell, input.signature.name, input.signature.role, '')
  }

  lines.push(input.footerNote, '')

  if (input.fallbackUrl) {
    lines.push(input.fallbackUrl, '')
  }

  lines.push(`${SITE_NAME} · ${SITE_TAGLINE}`)

  if (input.replyHint) {
    lines.push(`${input.replyHint} ${SUPPORT_EMAIL}`)
  }

  return lines.join('\n').trim()
}
