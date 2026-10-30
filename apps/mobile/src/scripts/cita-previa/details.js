export const DETAILS_URL =
  'https://icp.administracionelectronica.gob.es/icpco/acEntrada';

export const buildDetailsScript = (details = {}) => {
  const nie = JSON.stringify(details.nie ?? '');
  const name = JSON.stringify(details.Name ?? details.name ?? '');
  const nationality = Number.isInteger(details.nationality)
    ? details.nationality
    : null;

  return `
    (function() {
      const fillValue = (field, value) => {
        if (!field || value === '') {
          return;
        }

        field.value = value;
        field.dispatchEvent(new Event('input', {bubbles: true}));
        field.dispatchEvent(new Event('change', {bubbles: true}));
      };

      const idField = window.document.querySelector('#txtIdCitado');
      const nameField = window.document.querySelector('#txtDesCitado');
      const nationalityField = window.document.querySelector('#txtPaisNac');

      if (idField && ${nie} !== '') {
        fillValue(idField, ${nie});
      }

      if (nameField && ${name} !== '') {
        fillValue(nameField, ${name});
      }

      if (
        nationalityField &&
        nationalityField.options &&
        ${nationality} !== null &&
        nationalityField.options[${nationality}]
      ) {
        const nationalityOption = nationalityField.options[${nationality}];
        nationalityField.value = nationalityOption.value;
        nationalityOption.selected = true;
        nationalityField.dispatchEvent(new Event('input', {bubbles: true}));
        nationalityField.dispatchEvent(new Event('change', {bubbles: true}));
      }

      const submitButton = window.document.querySelector('#btnEnviar');

      if (submitButton) {
        submitButton.click();
      }
    })();
    true;
  `;
};
