export const PLACE_URL =
  'https://icp.administracionelectronica.gob.es/icpco/acOpciones';

export const buildPlaceScript = (sedeOptionIndex = 0) => `
  (function() {
    const select = window.document.querySelector('#idSede') ||
      window.document.querySelector('select[name="idSede"]');
    if (!select) {
      return;
    }

    const options = Array.from(select.options).filter(option =>
      option.value && !option.disabled,
    );
    const target = options[${sedeOptionIndex}] || options[0];
    if (!target) {
      return;
    }

    select.value = target.value;
    target.selected = true;
    select.dispatchEvent(new Event('input', {bubbles: true}));
    select.dispatchEvent(new Event('change', {bubbles: true}));

    const nextButton = window.document.querySelector('#btnSiguiente');
    if (nextButton) {
      nextButton.click();
    }
  })();
  true;
`;
