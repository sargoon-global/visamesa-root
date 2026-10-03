import { describe, expect, it } from 'vitest'

import { escapeHtml, renderEmailLayout, renderEmailText } from './emailLayout.js'

describe('emailLayout', () => {
  it('escapes hostile HTML in user-facing strings', () => {
    const html = renderEmailLayout({
      locale: 'en',
      previewText: '<script>',
      heading: '<b>Hi</b>',
      paragraphs: ['<img onerror=alert(1)>'],
      footerNote: 'safe',
    })

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;b&gt;Hi&lt;/b&gt;')
    expect(html).toContain('&lt;img onerror=alert(1)&gt;')
    expect(escapeHtml('"\'&<>')).toBe('&quot;&#39;&amp;&lt;&gt;')
  })

  it('omits CTA markup when no CTA is provided', () => {
    const html = renderEmailLayout({
      locale: 'en',
      previewText: 'preview',
      heading: 'Hello',
      paragraphs: ['Body'],
      footerNote: 'Footer',
    })

    expect(html).not.toContain('v:roundrect')
  })

  it('renders the logo on a full-width secondary header bar', () => {
    const html = renderEmailLayout({
      locale: 'en',
      previewText: 'preview',
      heading: 'Hello',
      paragraphs: ['Body'],
      footerNote: 'Footer',
    })

    expect(html).toContain('class="email-logo-bar"')
    expect(html).toContain('bgcolor="#00C49F"')
    expect(html).toContain('/brand/logo-email.png')
  })

  it('omits signature when not provided', () => {
    const html = renderEmailLayout({
      locale: 'en',
      previewText: 'preview',
      heading: 'Hello',
      paragraphs: ['Body'],
      footerNote: 'Footer',
    })

    expect(html).not.toContain('Co-founder')
  })

  it('builds plain text with paragraphs, signature, and CTA', () => {
    const text = renderEmailText({
      locale: 'en',
      previewText: 'preview',
      heading: 'Hello',
      paragraphs: ['First', 'Second'],
      cta: { label: 'Confirm', url: 'https://visamesa.com/en/waitlist/confirm/tok' },
      signature: {
        farewell: 'Talk soon,',
        name: 'Pejman',
        role: 'Co-founder, VisaMesa',
      },
      footerNote: 'Ignore if not you.',
      replyHint: 'Questions?',
    })

    expect(text).toContain('Hello')
    expect(text).toContain('First')
    expect(text).toContain('Second')
    expect(text).toContain('Confirm: https://visamesa.com/en/waitlist/confirm/tok')
    expect(text).toContain('Talk soon,')
    expect(text).toContain('Pejman')
    expect(text).toContain('Co-founder, VisaMesa')
    expect(text).toContain('Ignore if not you.')
    expect(text).toContain('Questions?')
    expect(text).toContain('support@visamesa.com')
  })
})
