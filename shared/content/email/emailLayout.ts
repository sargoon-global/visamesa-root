import { EMAIL_TAGLINE, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from '../siteConstants.js'
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

const PREHEADER_PAD = '&zwnj;&nbsp;'.repeat(48)

const CARD_BORDER_RADIUS_PX = 12

/** Matches visamesa_fe index.html (Plus Jakarta Sans + Noto Sans SC). */
const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Expletus+Sans:wght@600&family=Noto+Sans+SC:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'

const EMAIL_WORDMARK = 'VISAMESA'

/** Inline brand colors for email HTML (matches shared/design-tokens light theme). */
const emailColors = {
  primary: '#00215E',
  onPrimary: '#FFFFFF',
  secondary: '#00C49F',
  onSurface: '#1B1B1F',
  onSurfaceVariant: '#44464F',
  surface: '#FFFFFF',
  background: '#FCFCFC',
  outlineVariant: '#C5C6D0',
} as const

function emailBodyFontFamily(locale: SupportedLanguage): string {
  if (locale === 'zh') {
    return "'Noto Sans SC', 'Plus Jakarta Sans', Arial, Helvetica, sans-serif"
  }
  return "'Plus Jakarta Sans', 'Noto Sans SC', Arial, Helvetica, sans-serif"
}

const EMAIL_WORDMARK_FONT_FAMILY = "'Expletus Sans', Arial, Helvetica, sans-serif"

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderParagraphsHtml(paragraphs: string[], fontFamily: string): string {
  return paragraphs
    .map(
      (paragraph) =>
        `<p class="email-copy" style="margin: 0 0 16px; font-family: ${fontFamily}; font-size: 16px; line-height: 1.6; color: ${emailColors.onSurface};">${escapeHtml(paragraph)}</p>`,
    )
    .join('\n')
}

function renderCtaHtml(cta: { label: string; url: string }, fontFamily: string): string {
  const { primary, secondary } = emailColors
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 8px 0 28px;">
      <tr>
        <td align="center" bgcolor="${secondary}" style="border-radius: 999px; mso-line-height-rule: exactly;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(cta.url)}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="f" fillcolor="${secondary}">
            <w:anchorlock/>
            <center style="color:${primary};font-family:${fontFamily};font-size:16px;font-weight:600;">${escapeHtml(cta.label)}</center>
          </v:roundrect>
          <![endif]-->
          <a href="${escapeHtml(cta.url)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: ${secondary}; color: ${primary}; font-family: ${fontFamily}; font-size: 16px; font-weight: 600; line-height: 44px; text-decoration: none; padding: 0 24px; border-radius: 999px; mso-line-height-rule: exactly;">
            ${escapeHtml(cta.label)}
          </a>
        </td>
      </tr>
    </table>
  `.trim()
}

function renderSignatureHtml(
  signature: NonNullable<EmailLayoutInput['signature']>,
  fontFamily: string,
): string {
  const { onSurface, onSurfaceVariant } = emailColors
  return `
    <p class="email-copy" style="margin: 24px 0 4px; font-family: ${fontFamily}; font-size: 16px; line-height: 1.5; color: ${onSurface};">${escapeHtml(signature.farewell)}</p>
    <p class="email-copy" style="margin: 0 0 2px; font-family: ${fontFamily}; font-size: 16px; line-height: 1.5; font-weight: 600; color: ${onSurface};">${escapeHtml(signature.name)}</p>
    <p class="email-copy" style="margin: 0 0 24px; font-family: ${fontFamily}; font-size: 14px; line-height: 1.5; color: ${onSurfaceVariant};">${escapeHtml(signature.role)}</p>
  `.trim()
}

/**
 * HTML wordmark in the header (no remote image). Gmail and other clients often break
 * table layout when images are blocked; copy and CTA must not depend on image load.
 */
function renderLogoHeaderCellHtml(): string {
  const { primary, secondary } = emailColors
  const radius = CARD_BORDER_RADIUS_PX
  const wordmarkStyle = [
    `font-family: ${EMAIL_WORDMARK_FONT_FAMILY}`,
    'font-size: 20px',
    'font-weight: 600',
    `color: ${primary}`,
    'line-height: 1.2',
    'letter-spacing: 0.32em',
    'text-decoration: none',
    'text-transform: uppercase',
  ].join('; ')

  return `
    <td
      class="email-logo-bar"
      align="left"
      bgcolor="${secondary}"
      style="background-color: ${secondary}; padding: 18px 40px; border-radius: ${radius}px ${radius}px 0 0; mso-line-height-rule: exactly;"
    >
      <a href="${escapeHtml(SITE_URL)}" target="_blank" rel="noopener noreferrer" style="${wordmarkStyle}">${EMAIL_WORDMARK}</a>
    </td>
  `.trim()
}

export function renderEmailLayout(input: EmailLayoutInput): string {
  const { primary, onSurface, onSurfaceVariant, surface, background, outlineVariant, secondary } =
    emailColors
  const fontFamily = emailBodyFontFamily(input.locale)
  const radius = CARD_BORDER_RADIUS_PX

  const ctaBlock = input.cta ? renderCtaHtml(input.cta, fontFamily) : ''
  const signatureBlock = input.signature ? renderSignatureHtml(input.signature, fontFamily) : ''
  const fallbackBlock = input.fallbackUrl
    ? `<p class="email-copy" style="margin: 16px 0 0; font-family: ${fontFamily}; font-size: 12px; line-height: 1.5; color: ${onSurfaceVariant}; word-break: break-all;">${escapeHtml(input.fallbackUrl)}</p>`
    : ''
  const replyBlock = input.replyHint
    ? `<p class="email-copy" style="margin: 12px 0 0; font-family: ${fontFamily}; font-size: 13px; line-height: 1.5; color: ${onSurfaceVariant};">${escapeHtml(input.replyHint)} <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color: ${primary}; text-decoration: none;">${escapeHtml(SUPPORT_EMAIL)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="${escapeHtml(input.locale)}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(input.heading)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${GOOGLE_FONTS_HREF}" rel="stylesheet">
  <style>
    .email-copy { font-family: ${fontFamily}; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1B1B1F !important; }
      .email-card-body { background-color: #303033 !important; }
      .email-logo-bar { background-color: ${secondary} !important; }
      .email-text { color: #E3E2E6 !important; }
      .email-muted { color: #C5C6D0 !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: ${background}; font-family: ${fontFamily};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
    ${escapeHtml(input.previewText)}${PREHEADER_PAD}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${background};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding: 0;">
              <table
                role="presentation"
                class="email-card"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="width: 100%; max-width: 600px; border-collapse: separate !important; border-spacing: 0; border: 1px solid ${outlineVariant}; border-radius: ${radius}px; background-color: ${surface};"
              >
                <tr>
                  ${renderLogoHeaderCellHtml()}
                </tr>
                <tr>
                  <td
                    class="email-card-body email-padding"
                    style="background-color: ${surface}; padding: 32px 40px 32px; border-radius: 0 0 ${radius}px ${radius}px; font-family: ${fontFamily};"
                  >
                    <h1 class="email-text" style="margin: 0 0 20px; font-family: ${fontFamily}; font-size: 22px; line-height: 1.35; font-weight: 600; color: ${onSurface};">${escapeHtml(input.heading)}</h1>
                    ${renderParagraphsHtml(input.paragraphs, fontFamily)}
                    ${ctaBlock}
                    ${signatureBlock}
                    <p class="email-muted email-copy" style="margin: 0; font-family: ${fontFamily}; font-size: 14px; line-height: 1.6; color: ${onSurfaceVariant};">${escapeHtml(input.footerNote)}</p>
                    ${fallbackBlock}
                    <hr style="border: none; border-top: 1px solid ${outlineVariant}; margin: 28px 0 16px;">
                    <p class="email-muted email-copy" style="margin: 0; font-family: ${fontFamily}; font-size: 12px; line-height: 1.5; color: ${onSurfaceVariant};">${escapeHtml(SITE_NAME)} · ${escapeHtml(EMAIL_TAGLINE)}</p>
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

  lines.push(`${SITE_NAME} · ${EMAIL_TAGLINE}`)

  if (input.replyHint) {
    lines.push(`${input.replyHint} ${SUPPORT_EMAIL}`)
  }

  return lines.join('\n').trim()
}
