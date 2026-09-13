import { TIE_STEP_ORDER, type TieStepSlug } from './tieSteps/types.js'

export const PUBLIC_PROCESS_STEP_PATHS = TIE_STEP_ORDER.map(
  (slug: TieStepSlug) => `/process/${slug}` as const,
)

export const PUBLIC_INDEXABLE_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.9' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.6' },
  { path: '/terms', changefreq: 'monthly', priority: '0.6' },
  { path: '/legal-notice', changefreq: 'monthly', priority: '0.5' },
  { path: '/support', changefreq: 'monthly', priority: '0.7' },
  ...PUBLIC_PROCESS_STEP_PATHS.map((path) => ({
    path,
    changefreq: 'monthly' as const,
    priority: '0.8' as const,
  })),
] as const

export const PUBLIC_DISALLOW_PREFIXES = ['/checkout/', '/waitlist/'] as const
