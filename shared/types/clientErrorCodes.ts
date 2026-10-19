/** Keep in sync with BE `clientError.schema.ts` — single source of truth for mobile + backend. */
export const CLIENT_ERROR_CODES = [
  'PROGRESS_SYNC_FAILED',
  'WEBVIEW_LOAD_FAILED',
  'WEBVIEW_HTTP_ERROR',
  'WEBVIEW_INJECTION_TIMEOUT',
  'PAYMENT_CHECKOUT_SYNC_FAILED',
  'PAYMENT_ENTITLEMENTS_FAILED',
  'PAYMENT_RETURN_ENTITLEMENTS_TIMEOUT',
  'AUTH_GOOGLE_SIGN_IN_FAILED',
  'AUTH_SESSION_REFRESH_FAILED',
  'CONSENT_RECORD_FAILED',
  'CONSENT_FETCH_FAILED',
  'PROFILE_ENCRYPTED_SYNC_FAILED',
  'PROFILE_FETCH_FAILED',
  'PROFILE_DECRYPTION_FAILED',
  'MODELO_790_PROFILE_INVALID',
  'ACCOUNT_DELETE_FAILED',
  'ACCOUNT_EXPORT_FAILED',
] as const;

export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number];

export type ClientErrorContextValue = string | number | boolean | null;

export type ClientErrorContext = Record<string, ClientErrorContextValue>;
