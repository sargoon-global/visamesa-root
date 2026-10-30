export const OFICINA_URL =
  'https://icp.administracionelectronica.gob.es/icpco/citar';

export const buildOficinaScript = tramitesOptionIndex => `
  (function() {
    const normalize = value =>
      (value || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toUpperCase();

    const tramites =
      window.document.querySelector('#tramiteGrupo\\\\[0\\\\]') ||
      window.document.querySelector('select[name="tramiteGrupo[0]"]') ||
      window.document.querySelector('select');

    const tomarHuellaOption = tramites
      ? Array.from(tramites.options).find(option =>
          /TOMA\\s+DE\\s+HUELLAS?/.test(normalize(option.text)),
        )
      : null;
    const targetOption = tomarHuellaOption || tramites?.options?.[${tramitesOptionIndex}];

    if (!tramites || !targetOption) {
      return;
    }

    tramites.value = targetOption.value;
    targetOption.selected = true;
    tramites.dispatchEvent(new Event('input', {bubbles: true}));
    tramites.dispatchEvent(new Event('change', {bubbles: true}));

    const acceptButton =
      window.document.querySelector('#btnAceptar') ||
      Array.from(window.document.querySelectorAll('button, input[type="submit"]'))
        .find(button => /aceptar/i.test(button.textContent || button.value || ''));
    if (acceptButton) {
      acceptButton.click();
    }
  })();
  true;
`;
