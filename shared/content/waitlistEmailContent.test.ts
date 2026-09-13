import { describe, expect, it } from 'vitest'

import { buildWaitlistConfirmationEmail, getWaitlistEmailContent } from './waitlistEmailContent'

describe('waitlistEmailContent', () => {
  it('returns localized email copy', () => {
    expect(getWaitlistEmailContent('es').subject).toContain('lista de espera')
    expect(getWaitlistEmailContent('zh').subject).toContain('等候名单')
  })

  it('builds a confirmation email with a localized confirm URL', () => {
    const message = buildWaitlistConfirmationEmail({
      confirmationToken: 'token-123',
      locale: 'es',
      appUrl: 'https://visamesa.com',
    })

    expect(message.subject).toContain('lista de espera')
    expect(message.html).toContain('/es/waitlist/confirm/token-123')
    expect(message.text).toContain('https://visamesa.com/es/waitlist/confirm/token-123')
  })
})
