import { resolveApiBaseUrl } from './resolveApiBaseUrl'

export const API_BASE_URL = resolveApiBaseUrl()

export const API_ENDPOINTS = {
  // Auth
  googleAuth: '/auth/google',

  // Users
  usersMe: '/users/me',
  userDelete: '/users/me',
  userExport: '/users/me/export',
  encryptedDetails: '/users/me/encrypted-details',
  userConsent: '/users/me/consent',
  userProgress: '/users/me/progress',
  citaPreviaBooking: '/users/me/cita-previa-booking',
  personalDetailsLock: '/users/me/personal-details-lock',
  clientErrors: '/users/me/client-errors',
  supportTickets: '/users/support/tickets',
  publicSupportTickets: '/support/tickets',

  // Forms (future BE)
  formSchema: (formId: string) => `/forms/schema/${formId}`,

  // Payments
  paymentEntitlements: '/payments/entitlements',
  paymentCheckoutSync: '/payments/checkout/sync',
} as const
