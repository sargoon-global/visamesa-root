export const SITE_URL = 'https://visamesa.com'

/** Production backend API origin (no trailing slash). Shared by mobile, docs, and tooling. */
export const API_BASE_URL = 'https://api.visamesa.com'

/**
 * PRE_LAUNCH MODE
 * ================
 * When true, hides features that require a published app:
 * - Header sign-in button and Google OAuth panel
 * - Header "Get VisaMesa service" CTA (replaced with waitlist link)
 * - /pricing page (redirects to home #waitlist)
 * - App store badges in AppDownload section (shows "coming soon" instead)
 * - Hero pricing CTA (shows only waitlist)
 * - Closing CTA (shows waitlist instead of pricing)
 *
 * TO LAUNCH: Set to false and remove waitlist code.
 * See visamesa_fe/docs/PRE_LAUNCH.md for the full checklist.
 */
export const PRE_LAUNCH = true

/** Published service price in EUR (matches visamesa_be payment.config.ts full_service). */
export const SERVICE_PRICE_EUR = 100

/** Pre-discount list price shown on the website pricing card. */
export const SERVICE_ORIGINAL_PRICE_EUR = 160

/** @deprecated Use {@link SERVICE_PRICE_EUR}. */
export const SERVICE_STARTING_PRICE_EUR = SERVICE_PRICE_EUR
export const SITE_NAME = 'VisaMesa'
export const SITE_TAGLINE = 'TIE assistance in Barcelona'
export const SUPPORT_EMAIL = 'support@visamesa.com'
export const PRIVACY_EMAIL = 'privacy@visamesa.com'
