export type ApiErrorTranslateOptions = {
  ns?: string
  defaultValue?: string
}

export type ApiErrorTranslateFn = (
  key: string,
  options?: ApiErrorTranslateOptions,
) => string

const COMMON_API_ERROR_KEYS: Record<string, string> = {
  NOT_FOUND: 'errors.api.notFound',
  UNAUTHORIZED: 'errors.api.unauthorized',
  BAD_REQUEST: 'errors.api.badRequest',
  CONFLICT: 'errors.api.conflict',
  INTERNAL_ERROR: 'errors.api.internal',
  SERVICE_UNAVAILABLE: 'errors.api.unavailable',
}

const CHECKOUT_API_ERROR_KEYS: Record<string, string> = {
  ALREADY_ENTITLED: 'errors.alreadyEntitled',
}

const USER_API_ERROR_KEYS: Record<string, string> = {
  PROFILE_LOCKED: 'errors.profileLocked',
  FEE_PAYMENT_RECEIPT_REQUIRED: 'errors.feePaymentReceiptRequired',
  ENTITLEMENT_REQUIRED: 'errors.entitlementRequired',
  CITA_PREVIA_ALREADY_BOOKED: 'errors.citaPreviaAlreadyBooked',
}

export function resolveApiErrorMessage(
  input: { code?: string; message?: string },
  translate: ApiErrorTranslateFn,
  fallbackKey = 'errors.generic',
  fallbackNs = 'common',
): string {
  if (input.code) {
    const checkoutKey = CHECKOUT_API_ERROR_KEYS[input.code]

    if (checkoutKey) {
      return translate(checkoutKey, { ns: 'checkout' })
    }

    const userKey = USER_API_ERROR_KEYS[input.code]

    if (userKey) {
      return translate(userKey, { ns: 'common' })
    }

    const commonKey = COMMON_API_ERROR_KEYS[input.code]

    if (commonKey) {
      return translate(commonKey, { ns: 'common' })
    }
  }

  if (input.message) {
    return input.message
  }

  return translate(fallbackKey, { ns: fallbackNs })
}
