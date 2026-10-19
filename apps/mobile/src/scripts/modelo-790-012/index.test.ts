import {Script} from 'node:vm';

import {
  buildModelo790InjectionRules,
  MODELO_790_012_ENTRY_URL,
  MODELO_790_012_FORM_URL,
  MODELO_790_012_START_URL,
  type Modelo790AutomationProfile,
} from './index';

const testScriptStrings = {
  captchaPlaceholder: 'Enter captcha',
  captchaImageAlt: 'Security captcha code',
  submit: 'Continue',
  downloading: 'Downloading…',
  openingPdf: 'Opening PDF…',
  theme: {
    primary: '#00215E',
    onPrimary: '#FFFFFF',
    error: '#BA1A1A',
    outline: '#75777F',
    surface: '#FFFFFF',
  },
  captchaRetry: 'Retry captcha',
  captchaUnavailableTitle: 'Captcha unavailable',
  captchaUnavailableMessage: 'Captcha unavailable message',
  formUnavailableTitle: 'Form unavailable',
  formUnavailableMessage: 'Form unavailable message',
  downloadFailedTitle: 'Download failed',
  downloadFailedHttpMessage: 'HTTP failed',
  downloadFailedReadMessage: 'Read failed',
  downloadFailedUnexpectedMessage: 'Unexpected failed',
  downloadFailedRequestMessage: 'Request failed',
  submitFailedTitle: 'Submit failed',
  submitFailedMessage: 'Submit failed message',
  prepareFailedTitle: 'Prepare failed',
  prepareFailedMessage: 'Prepare failed message',
};

describe('modelo 790 automation rules', () => {
  const profile: Modelo790AutomationProfile = {
    documentNumber: 'Y1234567X',
    fullName: 'TEST USER',
    address: {
      streetType: 'CALLE',
      streetName: 'TEST STREET',
      number: '10',
      city: 'BARCELONA',
      province: 'BARCELONA',
      postalCode: '08001',
    },
    feeInputId: 'tasa5Input',
    paymentMethod: 'cash',
  };

  it('builds simple event-ready rules for the official Modelo 790 flow', () => {
    const rules = buildModelo790InjectionRules(profile, testScriptStrings);

    expect(MODELO_790_012_START_URL).toBe(MODELO_790_012_FORM_URL);

    expect(rules).toEqual([
      expect.objectContaining({
        id: 'modelo-790-open-form',
        url: MODELO_790_012_ENTRY_URL,
        match: expect.objectContaining({type: 'regex'}),
        ready: expect.objectContaining({
          selector: 'a[href="ImpresoRellenar"], a[href$="/ImpresoRellenar"]',
        }),
      }),
      expect.objectContaining({
        id: 'modelo-790-fill-form',
        match: {type: 'prefix', value: MODELO_790_012_FORM_URL},
        ready: expect.objectContaining({
          selector: '#nif',
          allSelectors: expect.arrayContaining(['#nombre', '#f_conc']),
        }),
      }),
    ]);
  });

  it('fills profile data and stops before captcha/download', () => {
    const fillRule = buildModelo790InjectionRules(profile, testScriptStrings).find(
      rule => rule.id === 'modelo-790-fill-form',
    );

    expect(fillRule?.script).toContain('Y1234567X');
    expect(fillRule?.script).toContain('TEST USER');
    expect(fillRule?.script).toContain('tasa5Input');
    expect(fillRule?.script).toContain('window.jQuery');
    expect(fillRule?.script).toContain('Modelo 790 fill script started');
    expect(fillRule?.script).toContain('validarYCalcularImporteFinal(false)');
    expect(fillRule?.script).toContain("fillValue('#numero'");
    expect(fillRule?.script).toContain("fillValue('#telefono'");
    expect(fillRule?.script).toContain('#codSeguridadForm');
    expect(fillRule?.script).toContain('visaMesaModelo790CaptchaOnly');
    expect(fillRule?.script).toContain('URLSearchParams(new FormData(form))');
    expect(fillRule?.script).toContain('__visaMesaAutomationError');
  });

  it('generates valid injectable JavaScript', () => {
    buildModelo790InjectionRules(profile, testScriptStrings).forEach(rule => {
      expect(() => new Script(rule.script)).not.toThrow();
    });
  });

  it('hides the official page behind a focused captcha/download overlay', () => {
    const fillRule = buildModelo790InjectionRules(profile, testScriptStrings).find(
      rule => rule.id === 'modelo-790-fill-form',
    );

    expect(fillRule?.script).toContain('overflow: hidden !important');
    expect(fillRule?.script).toContain(
      'body > *:not(#visaMesaModelo790CaptchaOnly)',
    );
    expect(fillRule?.script).toContain('Continue');
  });

  it('keeps page scripts simple without internal polling timers', () => {
    buildModelo790InjectionRules(profile, testScriptStrings).forEach(rule => {
      expect(rule.script).not.toContain('setTimeout');
      expect(rule.script).not.toContain('setInterval');
      expect(rule.script).not.toContain('MutationObserver');
    });
  });
});
