import { describe, expect, it } from 'vitest'

import { initSharedI18n, i18n } from '../i18n/init'
import { buildTieSteps } from '../tieSteps/buildTieSteps'
import { TIE_STEP_ORDER } from '../tieSteps/types'

describe('buildTieSteps', () => {
  it('builds localized steps keyed by slug for each supported language', async () => {
    for (const language of ['en', 'es', 'zh'] as const) {
      await initSharedI18n({ language })

      const steps = buildTieSteps((key, options) => i18n.t(key, options))

      expect(steps).toHaveLength(TIE_STEP_ORDER.length)
      expect(steps[0]?.slug).toBe('empadronamiento')
      expect(steps[1]?.slug).toBe('required-documents')
      expect(steps[2]?.slug).toBe('pay-fee')
      expect(steps[3]?.slug).toBe('toma-de-huellas')
      expect(steps[1]?.requirements).toHaveLength(1)
      expect(steps[3]?.requirements).toHaveLength(1)
      expect(steps[4]?.requirements.some(r => r.key === 'attend-appointment')).toBe(true)
      expect(steps[5]?.requirements.some(r => r.key === 'attend-pickup')).toBe(true)
    }
  })
})
