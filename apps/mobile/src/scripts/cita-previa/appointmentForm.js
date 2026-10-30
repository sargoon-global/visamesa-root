export const APPOINTMENT_FORM_URL =
  'https://icp.administracionelectronica.gob.es/icpco/acVerFormulario';

export const buildAppointmentFormScript = (details = {}) => {
  const phone = JSON.stringify(details.phone ?? '');
  const email = JSON.stringify(details.email ?? '');

  return `
    (function() {
      const fillValue = (selector, value) => {
        const field = window.document.querySelector(selector);
        if (!field || value === '') {
          return;
        }
        field.value = value;
        field.dispatchEvent(new Event('input', {bubbles: true}));
        field.dispatchEvent(new Event('change', {bubbles: true}));
        field.dispatchEvent(new Event('blur', {bubbles: true}));
      };

      fillValue('#txtTelefonoCitado', ${phone});
      fillValue('#emailUNO', ${email});
      fillValue('#emailDOS', ${email});

      const nextButton = window.document.querySelector('#btnSiguiente');
      if (nextButton) {
        nextButton.click();
      }
    })();
    true;
  `;
};
