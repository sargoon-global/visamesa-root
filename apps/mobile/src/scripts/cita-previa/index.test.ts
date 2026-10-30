import {
  citaPreviaPiiConfig,
  buildCitaPreviaInjectionRules,
  buildCitaPreviaScriptMap,
  type CitaPreviaBookingAssistantProfile,
} from './index';

describe('cita previa script map', () => {
  const profile: CitaPreviaBookingAssistantProfile = {
    details: {
      ...citaPreviaPiiConfig.details,
      nie: 'Y1234567X',
      Name: 'Test User',
    },
    provinceOptionIndex: 5,
    tramitesOptionIndex: 3,
  };

  it('builds a url to script map for the expected webview steps', () => {
    const scriptMap = buildCitaPreviaScriptMap(profile);

    expect(Object.keys(scriptMap)).toEqual(
      expect.arrayContaining([
        'https://icp.administracionelectronica.gob.es/icpplustieb/index.html?appVersion=V+7.53',
        'https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus',
        'https://sede.administracionespublicas.gob.es/icpplus/index.html',
        'https://icp.administracionelectronica.gob.es/icpplus/index.html',
        'https://icp.administracionelectronica.gob.es/icpco/acInfo',
        'https://icp.administracionelectronica.gob.es/icpco/acEntrada',
        'https://icp.administracionelectronica.gob.es/icpco/citar',
        'https://icp.administracionelectronica.gob.es/icpco/acOpciones',
        'https://icp.administracionelectronica.gob.es/icpco/acVerFormulario',
        'https://icp.administracionelectronica.gob.es/icpco/acValidarEntrada',
      ]),
    );

    expect(scriptMap['https://icp.administracionelectronica.gob.es/icpco/citar']).toContain(
      '#sede',
    );
    expect(scriptMap['https://icp.administracionelectronica.gob.es/icpco/citar']).toContain(
      'TOMA\\s+DE\\s+HUELLAS?',
    );
    expect(scriptMap['https://icp.administracionelectronica.gob.es/icpco/acEntrada']).toContain(
      'Y1234567X',
    );
    expect(scriptMap['https://icp.administracionelectronica.gob.es/icpco/acVerFormulario']).toContain(
      '#txtTelefonoCitado',
    );
  });

  it('exports a default pii config for manual runs', () => {
    expect(citaPreviaPiiConfig).toMatchObject({
      details: {
        nie: 'Y6950398L',
        Name: 'Girish Sardar',
        nationality: 88,
        documentType: 'nie',
      },
      provinceOptionIndex: 3,
      tramitesOptionIndex: 17,
      sedeOptionIndex: 0,
    });
  });

  it('keeps page scripts free of polling timers', () => {
    const scriptMap = buildCitaPreviaScriptMap(profile);

    Object.values(scriptMap).forEach(script => {
      expect(script).not.toContain('setTimeout');
      expect(script).not.toContain('setInterval');
    });
  });

  it('converts the map into injection rules for the direct ICP flow', () => {
    const rules = buildCitaPreviaInjectionRules(profile);

    expect(rules).toHaveLength(13);
    expect(rules.every(rule => Boolean(rule.ready?.selector))).toBe(true);
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          match: {
            type: 'exact',
            value:
              'https://icp.administracionelectronica.gob.es/icpplustieb/index.html?appVersion=V+7.53',
          },
          ready: {selector: 'select#form, #form, select[name="form"], select'},
        }),
        expect.objectContaining({
          match: {
            type: 'prefix',
            value: 'https://icp.administracionelectronica.gob.es/icpco/citar',
          },
          ready: {selector: '#sede, select[name^="tramiteGrupo"]'},
        }),
        expect.objectContaining({
          match: {
            type: 'prefix',
            value: 'https://icp.administracionelectronica.gob.es/icpco/acOfertarCita',
          },
          ready: {selector: '#captcha', allSelectors: ['#btnSiguiente']},
        }),
        expect.objectContaining({
          match: {
            type: 'prefix',
            value: 'https://icp.administracionelectronica.gob.es/icpco/acGrabarCita',
          },
          ready: {selector: '#justificanteFinal'},
        }),
      ]),
    );
  });
});
