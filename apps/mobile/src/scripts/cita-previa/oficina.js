export const OFICINA_URL =
  'https://icp.administracionelectronica.gob.es/icpco/citar';

export const buildOficinaScript = tramitesOptionIndex => `
  (function() {
    const normalize = value =>
      (value || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toUpperCase();

    const selectTomaDeHuellas = () => {
      const tramites = Array.from(
        window.document.querySelectorAll('select[name^="tramiteGrupo"]'),
      ).find(select =>
        Array.from(select.options).some(option =>
          /TOMA\\s+DE\\s+HUELLAS?/.test(normalize(option.text)),
        ),
      );
      if (!tramites) {
        return false;
      }

      const targetOption = Array.from(tramites.options).find(option =>
        /TOMA\\s+DE\\s+HUELLAS?/.test(normalize(option.text)),
      ) || tramites.options[${tramitesOptionIndex}];
      if (!targetOption) {
        return false;
      }

      const targetIndex = Array.from(tramites.options).indexOf(targetOption);
      tramites.focus();
      tramites.selectedIndex = targetIndex;
      tramites.value = targetOption.value;
      targetOption.selected = true;
      targetOption.click();
      tramites.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
      tramites.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

      if (typeof tramites.onchange === 'function') {
        tramites.onchange(new Event('change', {bubbles: true, cancelable: true}));
      }

      console.debug('[Cita Previa] Toma de Huellas selected', {
        name: tramites.name,
        id: tramites.id,
        value: tramites.value,
        selectedIndex: tramites.selectedIndex,
        text: targetOption.text,
      });
      return tramites.value === targetOption.value;
    };

    const accept = () => {
      const acceptButton =
        window.document.querySelector('#btnAceptar') ||
        Array.from(window.document.querySelectorAll('button, input[type="submit"]'))
          .find(button => /aceptar/i.test(button.textContent || button.value || ''));
      if (acceptButton) {
        acceptButton.click();
      }
    };

    if (selectTomaDeHuellas()) {
      accept();
      return;
    }

    const container = window.document.querySelector('#divGrupoTramites') || window.document.body;
    const observer = new MutationObserver(() => {
      if (selectTomaDeHuellas()) {
        observer.disconnect();
        accept();
      }
    });
    observer.observe(container, {childList: true, subtree: true});
  })();
  true;
`;
