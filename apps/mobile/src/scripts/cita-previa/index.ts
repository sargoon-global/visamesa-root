import type {
  WebViewInjectionMatch,
  WebViewInjectionRule,
} from '../../webViewInjection/scriptRegistry';
import type {CitaPreviaBookingAssistantProfile} from './config';
import {buildDetailsScript, DETAILS_URL} from './details';
import {CLAVE_SCRIPT, CLAVE_URL} from './clave';
import {
  ICP_PLUS_URL,
  INITIAL_PAGE_SCRIPT,
  LEGACY_ICP_PLUS_GATEWAY_URL,
} from './initialPage';
import {buildOficinaScript, OFICINA_URL} from './oficina';
import {
  APPOINTMENT_FORM_URL,
  buildAppointmentFormScript,
} from './appointmentForm';
import {buildPlaceScript, PLACE_URL} from './place';
import {buildProvinciaScript, PROVINCIA_URL} from './provincia';
import {SOLICITAR_CITA_SCRIPT, SOLICITAR_CITA_URL} from './solicitarCita';
import {
  SLOT_PICKER_SCRIPT,
  SLOT_PICKER_URL,
} from './slotpicker';
import {
  APPOINTMENT_CONFIRMATION_SCRIPT,
  APPOINTMENT_CONFIRMATION_URL,
} from './confirmation';
import {APPOINTMENT_FINAL_SCRIPT, APPOINTMENT_FINAL_URL} from './final';
export {
  isCitaPreviaMessage,
  type CitaPreviaAppointmentDraft,
  type CitaPreviaErrorCode,
  type CitaPreviaWebViewMessage,
} from './messages';

export const CITA_PREVIA_SEDE_ENTRY_URL =
  'https://sede.administracionespublicas.gob.es/icpplus/index.html';

/**
 * Official sede gateway — click #submit to reach ICP (avoids 403 on /icpplus/index.html in WebView).
 */
export const CITA_PREVIA_START_URL = ICP_PLUS_URL;

export {
  citaPreviaPiiConfig,
  CITA_PREVIA_BOOKING_DEFAULTS,
  emptyCitaPreviaBookingAssistantProfile,
  type CitaPreviaBookingAssistantProfile,
  type CitaPreviaDetails,
} from './config';

export interface CitaPreviaScriptMap {
  [url: string]: string;
}

interface CitaPreviaScriptEntry {
  url: string;
  script: string;
  match?: WebViewInjectionMatch;
  ready?: WebViewInjectionRule['ready'];
}

const buildCitaPreviaScriptEntries = (
  profile: CitaPreviaBookingAssistantProfile,
): CitaPreviaScriptEntry[] => {
  const detailsScript = buildDetailsScript({
    nie: profile.details.nie,
    Name: profile.details.Name,
    nationality: profile.details.nationality,
    documentType: profile.details.documentType,
  });
  const nationalityOptionSelector = Number.isInteger(
    profile.details.nationality,
  )
    ? `#txtPaisNac option:nth-child(${profile.details.nationality + 1})`
    : '#txtPaisNac option';

  const provinciaScript = buildProvinciaScript(profile.provinceOptionIndex);
  const placeScript = buildPlaceScript(profile.sedeOptionIndex ?? 0);
  const appointmentFormScript = buildAppointmentFormScript({
    phone: profile.details.phone,
    email: profile.details.email,
  });

  return [
    {
      url: ICP_PLUS_URL,
      script: provinciaScript,
      ready: {
        selector: 'select#form, #form, select[name="form"]',
      },
    },
    {
      url: LEGACY_ICP_PLUS_GATEWAY_URL,
      script: INITIAL_PAGE_SCRIPT,
      match: {
        type: 'prefix',
        value: LEGACY_ICP_PLUS_GATEWAY_URL,
      },
      ready: {
        selector: '#submit',
      },
    },
    {
      url: CITA_PREVIA_SEDE_ENTRY_URL,
      script: provinciaScript,
      match: {
        type: 'prefix',
        value: CITA_PREVIA_SEDE_ENTRY_URL,
      },
      ready: {
        selector: 'select#form, #form, select[name="form"]',
      },
    },
    {
      url: PROVINCIA_URL,
      script: provinciaScript,
      match: {
        type: 'prefix',
        value: PROVINCIA_URL,
      },
      ready: {
        selector: 'select#form, #form, select[name="form"]',
      },
    },
    {
      url: CLAVE_URL,
      script: CLAVE_SCRIPT,
      match: {
        type: 'prefix',
        value: CLAVE_URL,
      },
      ready: {
        selector: '#btnEntrar',
      },
    },
    {
      url: DETAILS_URL,
      script: detailsScript,
      match: {
        type: 'prefix',
        value: DETAILS_URL,
      },
      ready: {
        selector: '#txtIdCitado',
        allSelectors: [
          '#txtDesCitado',
          nationalityOptionSelector,
          '#btnEnviar',
        ],
      },
    },
    {
      url: OFICINA_URL,
      script: buildOficinaScript(profile.tramitesOptionIndex),
      ready: {
        selector: '#tramiteGrupo\\[0\\]',
      },
    },
    {
      url: PLACE_URL,
      script: placeScript,
      match: {
        type: 'prefix',
        value: PLACE_URL,
      },
      ready: {
        selector: '#idSede, select[name="idSede"]',
      },
    },
    {
      url: APPOINTMENT_FORM_URL,
      script: appointmentFormScript,
      match: {
        type: 'prefix',
        value: APPOINTMENT_FORM_URL,
      },
      ready: {
        selector: '#txtTelefonoCitado',
        allSelectors: ['#emailUNO', '#emailDOS', '#btnSiguiente'],
      },
    },
    {
      url: SOLICITAR_CITA_URL,
      script: SOLICITAR_CITA_SCRIPT,
      match: {
        type: 'prefix',
        value: SOLICITAR_CITA_URL,
      },
      ready: {
        selector: '#btnEnviar',
      },
    },
    {
      url: SLOT_PICKER_URL,
      script: SLOT_PICKER_SCRIPT,
      match: {
        type: 'prefix',
        value: SLOT_PICKER_URL,
      },
      ready: {
        selector: '#captcha',
        allSelectors: ['#btnSiguiente'],
      },
    },
    {
      url: APPOINTMENT_CONFIRMATION_URL,
      script: APPOINTMENT_CONFIRMATION_SCRIPT,
      match: {
        type: 'prefix',
        value: APPOINTMENT_CONFIRMATION_URL,
      },
      ready: {
        selector: '#chkTotal',
        allSelectors: ['#citadoForm', '#btnConfirmar'],
      },
    },
    {
      url: APPOINTMENT_FINAL_URL,
      script: APPOINTMENT_FINAL_SCRIPT,
      match: {
        type: 'prefix',
        value: APPOINTMENT_FINAL_URL,
      },
      ready: {
        selector: '#justificanteFinal',
      },
    },
  ];
};

export const buildCitaPreviaScriptMap = (
  profile: CitaPreviaBookingAssistantProfile,
): CitaPreviaScriptMap => {
  return buildCitaPreviaScriptEntries(profile).reduce<CitaPreviaScriptMap>(
    (scriptMap, entry) => {
      scriptMap[entry.url] = entry.script;
      return scriptMap;
    },
    {},
  );
};

export const buildCitaPreviaInjectionRules = (
  profile: CitaPreviaBookingAssistantProfile,
): WebViewInjectionRule[] =>
  buildCitaPreviaScriptEntries(profile).map(entry => ({
    id: `cita-previa-${entry.url}`,
    match: entry.match ?? {
      type: 'exact',
      value: entry.url,
    },
    script: entry.script,
    ready: entry.ready,
  }));
