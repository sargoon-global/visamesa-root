export const PROVINCIA_URL =
  'https://icp.administracionelectronica.gob.es/icpplus/index.html';

export const buildProvinciaScript = provinceOptionIndex => `
  (function() {
    const dropdown =
      window.document.querySelector('select#form') ||
      window.document.querySelector('#form') ||
      window.document.querySelector('select[name="form"]') ||
      window.document.querySelector('select');
    const targetOption = dropdown?.options?.[${provinceOptionIndex}];

    if (!dropdown || !targetOption) {
      return;
    }

    dropdown.value = targetOption.value;
    targetOption.selected = true;
    dropdown.dispatchEvent(new Event('input', {bubbles: true}));
    dropdown.dispatchEvent(new Event('change', {bubbles: true}));

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
