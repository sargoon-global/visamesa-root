import { describe, expect, it } from 'vitest'

import { resolveApiErrorMessage } from './apiErrors'

describe('resolveApiErrorMessage', () => {
  const translate = (key: string, options?: { ns?: string }) =>
    `${options?.ns ?? 'common'}:${key}`

  it('maps known checkout error codes', () => {
    expect(
      resolveApiErrorMessage({ code: 'ALREADY_ENTITLED' }, translate),
    ).toBe('checkout:errors.alreadyEntitled')
  })

  it('maps known common error codes', () => {
    expect(resolveApiErrorMessage({ code: 'NOT_FOUND' }, translate)).toBe(
      'common:errors.api.notFound',
    )
  })

  it('maps profile locked to common copy', () => {
    expect(resolveApiErrorMessage({ code: 'PROFILE_LOCKED' }, translate)).toBe(
      'common:errors.profileLocked',
    )
  })

  it('maps fee payment receipt required for profile lock', () => {
    expect(
      resolveApiErrorMessage({ code: 'FEE_PAYMENT_RECEIPT_REQUIRED' }, translate),
    ).toBe('common:errors.feePaymentReceiptRequired')
  })

  it('falls back to the server message when code is unknown', () => {
    expect(
      resolveApiErrorMessage(
        { code: 'CUSTOM', message: 'Server said no' },
        translate,
      ),
    ).toBe('Server said no')
  })

  it('uses the fallback key when no code or message is provided', () => {
    expect(
      resolveApiErrorMessage({}, translate, 'errors.generic', 'common'),
    ).toBe('common:errors.generic')
  })
})
