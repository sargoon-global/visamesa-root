export const OFICINA_URL =
  'https://icp.administracionelectronica.gob.es/icpco/citar';

export const buildOficinaScript = (
  tramitesOptionIndex,
  sedeOptionIndex = 0,
) => `
  (function() {
    const normalize = value =>
      (value || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toUpperCase();

    const selectOffice = () => {
      const office = window.document.querySelector('#sede');
      if (!office) {
        return;
      }

      const options = Array.from(office.options).filter(option =>
        option.value && !option.disabled,
      );
      const target = options[${sedeOptionIndex}] || options[0];
      if (!target) {
        return;
      }

      office.value = target.value;
      target.selected = true;
      office.dispatchEvent(new Event('input', {bubbles: true}));
      office.dispatchEvent(new Event('change', {bubbles: true}));
    };

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

      tramites.value = targetOption.value;
      targetOption.selected = true;
      tramites.dispatchEvent(new Event('input', {bubbles: true}));
      tramites.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
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

    selectOffice();
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
