import {Script} from 'node:vm';

import {
  buildModelo790InjectionRules,
  MODELO_790_012_ENTRY_URL,
  MODELO_790_012_FORM_URL,
  MODELO_790_012_START_URL,
  type Modelo790AutomationProfile,
} from './index';

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
    const rules = buildModelo790InjectionRules(profile);

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
    const fillRule = buildModelo790InjectionRules(profile).find(
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
    buildModelo790InjectionRules(profile).forEach(rule => {
      expect(() => new Script(rule.script)).not.toThrow();
    });
  });

  it('hides the official page behind a focused captcha/download overlay', () => {
    const fillRule = buildModelo790InjectionRules(profile).find(
      rule => rule.id === 'modelo-790-fill-form',
    );

    expect(fillRule?.script).toContain('overflow: hidden !important');
    expect(fillRule?.script).toContain(
      'body > *:not(#visaMesaModelo790CaptchaOnly)',
    );
    expect(fillRule?.script).toContain('Download Modelo 790');
  });

  it('keeps page scripts simple without internal polling timers', () => {
    buildModelo790InjectionRules(profile).forEach(rule => {
      expect(rule.script).not.toContain('setTimeout');
      expect(rule.script).not.toContain('setInterval');
      expect(rule.script).not.toContain('MutationObserver');
    });
  });
});
