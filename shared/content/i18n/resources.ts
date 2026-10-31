import type { Resource } from 'i18next'

import authEn from '../locales/en/auth.json'
import checkoutEn from '../locales/en/checkout.json'
import commonEn from '../locales/en/common.json'
import dashboardEn from '../locales/en/dashboard.json'
import formsEn from '../locales/en/forms.json'
import homeEn from '../locales/en/home.json'
import legalEn from '../locales/en/legal.json'
import marketingEn from '../locales/en/marketing.json'
import profileEn from '../locales/en/profile.json'
import settingsEn from '../locales/en/settings.json'
import supportEn from '../locales/en/support.json'
import processOverviewEn from '../locales/en/processOverview.json'
import tieStepsEn from '../locales/en/tieSteps.json'
import authEs from '../locales/es/auth.json'
import checkoutEs from '../locales/es/checkout.json'
import commonEs from '../locales/es/common.json'
import dashboardEs from '../locales/es/dashboard.json'
import formsEs from '../locales/es/forms.json'
import homeEs from '../locales/es/home.json'
import legalEs from '../locales/es/legal.json'
import marketingEs from '../locales/es/marketing.json'
import profileEs from '../locales/es/profile.json'
import settingsEs from '../locales/es/settings.json'
import supportEs from '../locales/es/support.json'
import processOverviewEs from '../locales/es/processOverview.json'
import tieStepsEs from '../locales/es/tieSteps.json'
import authZh from '../locales/zh/auth.json'
import checkoutZh from '../locales/zh/checkout.json'
import commonZh from '../locales/zh/common.json'
import dashboardZh from '../locales/zh/dashboard.json'
import formsZh from '../locales/zh/forms.json'
import homeZh from '../locales/zh/home.json'
import legalZh from '../locales/zh/legal.json'
import marketingZh from '../locales/zh/marketing.json'
import profileZh from '../locales/zh/profile.json'
import settingsZh from '../locales/zh/settings.json'
import supportZh from '../locales/zh/support.json'
import processOverviewZh from '../locales/zh/processOverview.json'
import tieStepsZh from '../locales/zh/tieSteps.json'
import { DEFAULT_LANGUAGE, type SupportedLanguage } from './types'

export const translationResources = {
  en: {
    common: commonEn,
    marketing: marketingEn,
    checkout: checkoutEn,
    legal: legalEn,
    tieSteps: tieStepsEn,
    dashboard: dashboardEn,
    forms: formsEn,
    profile: profileEn,
    settings: settingsEn,
    support: supportEn,
    auth: authEn,
    home: homeEn,
    processOverview: processOverviewEn,
  },
  es: {
    common: commonEs,
    marketing: marketingEs,
    checkout: checkoutEs,
    legal: legalEs,
    tieSteps: tieStepsEs,
    dashboard: dashboardEs,
    forms: formsEs,
    profile: profileEs,
    settings: settingsEs,
    support: supportEs,
    auth: authEs,
    home: homeEs,
    processOverview: processOverviewEs,
  },
  zh: {
    common: commonZh,
    marketing: marketingZh,
    checkout: checkoutZh,
    legal: legalZh,
    tieSteps: tieStepsZh,
    dashboard: dashboardZh,
    forms: formsZh,
    profile: profileZh,
    settings: settingsZh,
    support: supportZh,
    auth: authZh,
    home: homeZh,
    processOverview: processOverviewZh,
  },
} satisfies Record<SupportedLanguage, Record<string, unknown>>

export type TranslationResources = typeof translationResources

/** i18next key autocomplete — large JSON namespaces are widened to avoid tsc OOM. */
export type I18nResources = Omit<
  TranslationResources[typeof DEFAULT_LANGUAGE],
  'tieSteps' | 'legal'
> & {
  tieSteps: Record<string, unknown>;
  legal: Record<string, unknown>;
};

export function createI18nResources(): Resource {
  return translationResources as Resource
}

export const DEFAULT_NAMESPACE = 'common'

export const I18N_NAMESPACES = Object.keys(
  translationResources[DEFAULT_LANGUAGE],
) as Array<keyof TranslationResources[typeof DEFAULT_LANGUAGE]>

export function getFallbackLanguage(): SupportedLanguage {
  return DEFAULT_LANGUAGE
}
