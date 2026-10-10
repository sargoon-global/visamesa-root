import type {WebViewInjectionRule} from '../../webViewInjection/scriptRegistry';

import {
  MODELO_790_012_ENTRY_URL,
  MODELO_790_012_FORM_URL,
  MODELO_790_012_INITIAL_PAGE_SCRIPT,
} from './initialPage';
import type {Modelo790AutomationProfile} from './config';
import {buildModelo790FillFormScript} from './fillForm';

export {
  MODELO_790_012_ENTRY_URL,
  MODELO_790_012_FORM_URL,
  MODELO_790_012_START_URL,
} from './initialPage';
export {type Modelo790AutomationProfile} from './config';

interface Modelo790ScriptEntry {
  id: string;
  url: string;
  match: WebViewInjectionRule['match'];
  script: string;
  ready?: WebViewInjectionRule['ready'];
  reinjectOnLoadEnd?: WebViewInjectionRule['reinjectOnLoadEnd'];
}

const buildModelo790ScriptEntries = (
  profile: Modelo790AutomationProfile,
): Modelo790ScriptEntry[] => [
  {
    id: 'modelo-790-open-form',
    url: MODELO_790_012_ENTRY_URL,
    match: {
      type: 'regex',
      value: /^https:\/\/sede\.policia\.gob\.es\/Tasa790_012\/?$/,
    },
    script: MODELO_790_012_INITIAL_PAGE_SCRIPT,
    ready: {
      selector: 'a[href="ImpresoRellenar"], a[href$="/ImpresoRellenar"]',
      timeoutMs: 10000,
    },
  },
  {
    id: 'modelo-790-fill-form',
    url: MODELO_790_012_FORM_URL,
    match: {type: 'prefix', value: MODELO_790_012_FORM_URL},
    script: buildModelo790FillFormScript(profile),
    ready: {
      selector: '#nif',
      allSelectors: ['#nombre', '#f_conc'],
      timeoutMs: 10000,
    },
    reinjectOnLoadEnd: true,
  },
];

export const buildModelo790InjectionRules = (
  profile: Modelo790AutomationProfile,
): WebViewInjectionRule[] => buildModelo790ScriptEntries(profile);
