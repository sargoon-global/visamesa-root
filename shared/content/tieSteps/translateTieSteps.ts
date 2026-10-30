import type { i18n as I18nInstance } from 'i18next'

import type { TieStepsTranslateFn } from './buildTieSteps.js'

export function createTieStepsTranslator(
  instance: Pick<I18nInstance, 't'>,
): TieStepsTranslateFn {
  return (key: string, options?: { returnObjects?: boolean }) => instance.t(key, options as never) as string | unknown
}
