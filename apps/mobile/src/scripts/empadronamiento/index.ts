import type {WebViewInjectionRule} from '../../webViewInjection/scriptRegistry';

import type {EmpadronamientoBookingAssistantProfile} from './config';
import {empadronamientoPiiConfig} from './config';
import {withEmpadronamientoCookieConsent} from './cookie-consent';
import {EMPADRONAMIENTO_HOME_URL, INITIA_SCRIPT} from './initia';
import {buildMotiveScript} from './motive';
import {
  EMPADRONAMIENTO_SEARCH_RESULT_PATH,
  EMPADRONAMIENTO_SEARCH_RESULT_URL,
  OSC_SELECT_SCRIPT,
} from './OSC-select';
import {buildPersonalInfoScript} from './personal-info';
import {SELECT_DATE_SCRIPT} from './select-date';
import {SELECT_OFICINA_SCRIPT} from './select-oficina';
import {SELECT_TIME_SCRIPT} from './select-time';
import {SOLICIT_SCRIPT} from './solicit';
import {
  EMPADRONAMIENTO_TRAMIT_PATH,
  EMPADRONAMIENTO_TRAMIT_URL,
  START_TRAMIT_SCRIPT,
} from './start-tramit';
import {
  CONFIRM_EMPADRONAMIENTO_SUBMIT_SCRIPT,
  EMPADRONAMIENTO_RESULT_SCRIPT,
  SUBMIT_FINAL_SCRIPT,
} from './submit-final';
import {TEMA_SCRIPT} from './tema';

export {
  empadronamientoPiiConfig,
  type EmpadronamientoBookingAssistantProfile,
} from './config';
export {EMPADRONAMIENTO_HOME_URL} from './initia';

/** Appointment flow pages after starting the tramit (update if Barcelona changes routes). */
const EMPADRONAMIENTO_CITA_PREFIX = `${EMPADRONAMIENTO_HOME_URL}/cita`;
const EMPADRONAMIENTO_FORM_PREFIX =
  'https://seuelectronica.ajuntament.barcelona.cat/oficinavirtual/form/diac-cites/ca/citizen/sol';

export interface EmpadronamientoScriptMap {
  [url: string]: string;
}

interface EmpadronamientoScriptEntry {
  id: string;
  url: string;
  match: WebViewInjectionRule['match'];
  script: string;
  ready?: WebViewInjectionRule['ready'];
  reinjectOnLoadEnd?: WebViewInjectionRule['reinjectOnLoadEnd'];
}

const buildEmpadronamientoScriptEntries = (
  profile: EmpadronamientoBookingAssistantProfile,
): EmpadronamientoScriptEntry[] => [
  {
    id: 'empadronamiento-home',
    url: EMPADRONAMIENTO_HOME_URL,
    match: {type: 'exact', value: EMPADRONAMIENTO_HOME_URL},
    script: INITIA_SCRIPT,
    ready: {
      selector:
        'a[href*="/oficinavirtual/ca/search-result"][href*="idCategory=21"]',
      timeoutMs: 30000,
    },
  },
  {
    id: 'empadronamiento-search-result',
    url: EMPADRONAMIENTO_SEARCH_RESULT_URL,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_HOME_URL}${EMPADRONAMIENTO_SEARCH_RESULT_PATH}`,
    },
    script: OSC_SELECT_SCRIPT,
    ready: {selector: 'a[href*="/tramit/"]', timeoutMs: 10000},
  },
  {
    id: 'empadronamiento-start-tramit',
    url: EMPADRONAMIENTO_TRAMIT_URL,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_HOME_URL}${EMPADRONAMIENTO_TRAMIT_PATH}`,
    },
    script: START_TRAMIT_SCRIPT,
    ready: {
      selector: 'button[type="button"][rel="nofollow"]',
      timeoutMs: 10000,
    },
  },
  {
    id: 'empadronamiento-tema',
    url: `${EMPADRONAMIENTO_FORM_PREFIX}/new/2393`,
    match: {type: 'prefix', value: `${EMPADRONAMIENTO_FORM_PREFIX}/new/2393`},
    script: TEMA_SCRIPT,
    ready: {selector: '#solicitud', timeoutMs: 30000},
  },
  {
    id: 'empadronamiento-personal-info',
    url: `${EMPADRONAMIENTO_CITA_PREFIX}/personal-info`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_CITA_PREFIX}/personal-info`,
    },
    script: buildPersonalInfoScript(profile.personalInfo),
    ready: {selector: 'input[formcontrolname="identifier"]'},
  },
  {
    id: 'empadronamiento-personal-info-form',
    url: `${EMPADRONAMIENTO_FORM_PREFIX}/identification/2393`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_FORM_PREFIX}/identification/2393`,
    },
    script: buildPersonalInfoScript(profile.personalInfo),
    ready: {selector: 'input[formcontrolname="identifier"]', timeoutMs: 30000},
  },
  {
    id: 'empadronamiento-motive',
    url: `${EMPADRONAMIENTO_CITA_PREFIX}/motive`,
    match: {type: 'prefix', value: `${EMPADRONAMIENTO_CITA_PREFIX}/motive`},
    script: buildMotiveScript(profile.motive),
    ready: {selector: 'textarea#motivo[name="motivo"]'},
  },
  {
    id: 'empadronamiento-motive-form',
    url: `${EMPADRONAMIENTO_FORM_PREFIX}/tramitData/meetingReason`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_FORM_PREFIX}/tramitData/meetingReason`,
    },
    script: buildMotiveScript(profile.motive),
    ready: {selector: 'textarea#motivo[name="motivo"]', timeoutMs: 30000},
  },
  {
    id: 'empadronamiento-select-date-form',
    url: `${EMPADRONAMIENTO_FORM_PREFIX}/subthemes/detail/OAPAD`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_FORM_PREFIX}/subthemes/detail/OAPAD`,
    },
    script: SELECT_DATE_SCRIPT,
    ready: {
      selector: 'mat-calendar td[role="button"][aria-label]',
      timeoutMs: 30000,
    },
  },
  {
    id: 'empadronamiento-select-oficina',
    url: `${EMPADRONAMIENTO_CITA_PREFIX}/select-oficina`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_CITA_PREFIX}/select-oficina`,
    },
    script: SELECT_OFICINA_SCRIPT,
    ready: {selector: 'input[type="radio"][name="oficinas"]'},
  },
  {
    id: 'empadronamiento-select-oficina-form',
    url: `${EMPADRONAMIENTO_FORM_PREFIX}/tramitDataOffice`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_FORM_PREFIX}/tramitDataOffice`,
    },
    script: SELECT_OFICINA_SCRIPT,
    ready: {
      selector: 'input[type="radio"][name="oficinas"]',
      timeoutMs: 30000,
    },
  },
  {
    id: 'empadronamiento-select-date',
    url: `${EMPADRONAMIENTO_CITA_PREFIX}/select-date`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_CITA_PREFIX}/select-date`,
    },
    script: SELECT_DATE_SCRIPT,
    ready: {selector: 'mat-calendar td[role="button"][aria-label]'},
  },
  {
    id: 'empadronamiento-select-time',
    url: `${EMPADRONAMIENTO_CITA_PREFIX}/select-time`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_CITA_PREFIX}/select-time`,
    },
    script: SELECT_TIME_SCRIPT,
    ready: {selector: 'input[type="radio"][name="hora"][aria-label]'},
  },
  {
    id: 'empadronamiento-select-time-form',
    url: `${EMPADRONAMIENTO_FORM_PREFIX}/tramitData/meetingSchedule`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_FORM_PREFIX}/tramitData/meetingSchedule`,
    },
    script: SELECT_TIME_SCRIPT,
    ready: {
      selector: 'input[type="radio"][name="hora"][aria-label]',
      timeoutMs: 30000,
    },
  },
  {
    id: 'empadronamiento-solicit',
    url: `${EMPADRONAMIENTO_CITA_PREFIX}/solicit`,
    match: {type: 'prefix', value: `${EMPADRONAMIENTO_CITA_PREFIX}/solicit`},
    script: SOLICIT_SCRIPT,
    ready: {selector: '#solicitud'},
  },
  {
    id: 'empadronamiento-submit-final',
    url: `${EMPADRONAMIENTO_CITA_PREFIX}/submit-final`,
    match: {
      type: 'prefix',
      value: `${EMPADRONAMIENTO_CITA_PREFIX}/submit-final`,
    },
    script: SUBMIT_FINAL_SCRIPT,
    ready: {selector: 'button[type="submit"]'},
    reinjectOnLoadEnd: true,
  },
  {
    id: 'empadronamiento-result',
    url: EMPADRONAMIENTO_FORM_PREFIX,
    match: {
      type: 'regex',
      value: /^https:\/\/seuelectronica\.ajuntament\.barcelona\.cat\/oficinavirtual\/(?:form\/diac-cites\/ca\/citizen\/sol|ca\/cita)/,
    },
    script: EMPADRONAMIENTO_RESULT_SCRIPT,
    reinjectOnLoadEnd: true,
  },
];

export const buildEmpadronamientoScriptMap = (
  profile: EmpadronamientoBookingAssistantProfile,
): EmpadronamientoScriptMap =>
  buildEmpadronamientoScriptEntries(profile).reduce<EmpadronamientoScriptMap>(
    (scriptMap, entry) => {
      scriptMap[entry.url] = withEmpadronamientoCookieConsent(entry.script);
      return scriptMap;
    },
    {},
  );

const getRuleMatchLength = (rule: WebViewInjectionRule) => {
  switch (rule.match.type) {
    case 'exact':
    case 'prefix':
      return rule.match.value.length;
    default:
      return 0;
  }
};

export const buildEmpadronamientoInjectionRules = (
  profile: EmpadronamientoBookingAssistantProfile = empadronamientoPiiConfig,
): WebViewInjectionRule[] =>
  buildEmpadronamientoScriptEntries(profile)
    .map(entry => ({
      id: entry.id,
      match: entry.match,
      script: withEmpadronamientoCookieConsent(entry.script),
      ready: entry.ready,
      reinjectOnLoadEnd: entry.reinjectOnLoadEnd,
    }))
    .sort(
      (left, right) => getRuleMatchLength(right) - getRuleMatchLength(left),
    );

export {CONFIRM_EMPADRONAMIENTO_SUBMIT_SCRIPT};
