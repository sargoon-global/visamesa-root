import { describe, expect, it } from 'vitest'

import { TIE_STEP_ORDER } from './tieSteps/types.js'
import {
  PUBLIC_DISALLOW_PREFIXES,
  PUBLIC_INDEXABLE_ROUTES,
  PUBLIC_PROCESS_STEP_PATHS,
} from './siteSeoRoutes.js'

describe('siteSeoRoutes', () => {
  it('lists every marketing process step path', () => {
    expect(PUBLIC_PROCESS_STEP_PATHS).toHaveLength(TIE_STEP_ORDER.length)
    for (const slug of TIE_STEP_ORDER) {
      expect(PUBLIC_PROCESS_STEP_PATHS).toContain(`/process/${slug}`)
    }
  })

  it('includes core marketing routes and localized process pages', () => {
    const paths = PUBLIC_INDEXABLE_ROUTES.map(route => route.path)

    expect(paths).toContain('/')
    expect(paths).toContain('/pricing')
    expect(paths).toContain('/support')
    expect(paths).toContain('/legal-notice')

    for (const stepPath of PUBLIC_PROCESS_STEP_PATHS) {
      expect(paths).toContain(stepPath)
    }
  })

  it('disallows checkout and waitlist confirmation paths', () => {
    expect(PUBLIC_DISALLOW_PREFIXES).toContain('/checkout/')
    expect(PUBLIC_DISALLOW_PREFIXES).toContain('/waitlist/')
  })
})
