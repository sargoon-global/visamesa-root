import { describe, expect, it } from 'vitest'

import { SUPPORTED_LANGUAGES } from './i18n/types.js'
import {
  buildWaitlistConfirmationEmail,
  getWaitlistEmailContent,
  getWaitlistEmailContentKeys,
} from './waitlistEmailContent'

describe('waitlistEmailContent', () => {
  it('returns localized email copy', () => {
    expect(getWaitlistEmailContent('es').subject).toContain('confirmación')
    expect(getWaitlistEmailContent('zh').subject).toContain('确认')
  })

  it('defines every email content key in each locale', () => {
    const keys = getWaitlistEmailContentKeys()

    for (const locale of SUPPORTED_LANGUAGES) {
      const content = getWaitlistEmailContent(locale)
      for (const key of keys) {
        expect(content[key], `${locale}.${key}`).toBeTruthy()
      }
    }
  })

  it('builds a branded confirmation email with a localized confirm URL', () => {
    const message = buildWaitlistConfirmationEmail({
      confirmationToken: 'token-123',
      locale: 'es',
      appUrl: 'https://visamesa.com',
    })

    expect(message.subject).toContain('confirmación')
    expect(message.html).toContain('<!DOCTYPE html>')
    expect(message.html).toContain('lang="es"')
    expect(message.html).toContain('max-width: 600px')
    expect(message.html).toContain('Confirma tu correo y nos encargamos del resto.')
    expect(message.html).toContain('/brand/logo-email.png')
    expect(message.html).toContain('/es/waitlist/confirm/token-123')
    expect(message.html).toContain('#00215E')
    expect(message.html).toContain('#00C49F')
    expect(message.html).not.toContain('#1b5e20')
    expect(message.html).not.toContain('No spam')
    expect(message.html).not.toContain('token-123</p>')
    expect(message.text).toContain('https://visamesa.com/es/waitlist/confirm/token-123')
    expect(message.text).toContain('Pejman')
  })
})
