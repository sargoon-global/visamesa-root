export const sizes = {
  touchTargetMin: 44,
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    hero: 48,
  },
  /** Header / profile brand mark heights (logotype uses labelLarge / 14px on web). */
  brand: {
    markHeightDesktop: 40,
    markHeightMobile: 32,
    markHeightHero: 72,
  },
  stepper: {
    itemWidth: 72,
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 900,
    xl: 1200,
  },
  viewportMin: 320,
  contentMaxWidth: 480,
  marketingMaxWidth: 1120,
  readingMaxWidth: 720,
  heroCopyMaxWidth: 576,
  sectionLeadMaxWidth: 640,
} as const

export type Sizes = typeof sizes
