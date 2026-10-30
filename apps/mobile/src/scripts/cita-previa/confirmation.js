export const APPOINTMENT_CONFIRMATION_URL =
  'https://icp.administracionelectronica.gob.es/icpplustieb/acVerificarCita';

export const APPOINTMENT_CONFIRMATION_SCRIPT = `
  (function() {
    const form = document.querySelector('#citadoForm');
    const required = document.querySelector('#chkTotal');
    const optionalRgpd = document.querySelector('#aceptaRgpd');
    const confirmButton = document.querySelector('#btnConfirmar');

    if (!form || !required || !confirmButton) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'cita-previa-error',
        payload: {code: 'appointment_confirmation_unavailable'},
      }));
      return;
    }

    required.checked = true;
    required.dispatchEvent(new Event('input', {bubbles: true}));
    required.dispatchEvent(new Event('change', {bubbles: true}));

    if (optionalRgpd) {
      optionalRgpd.checked = true;
      optionalRgpd.dispatchEvent(new Event('input', {bubbles: true}));
      optionalRgpd.dispatchEvent(new Event('change', {bubbles: true}));
    }

    if (!required.checked || (optionalRgpd && !optionalRgpd.checked)) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'cita-previa-error',
        payload: {code: 'appointment_confirmation_unavailable'},
      }));
      return;
    }

    if (!window.__visaMesaCitaPreviaConfirmationSubmitted) {
      window.__visaMesaCitaPreviaConfirmationSubmitted = true;
      confirmButton.click();
    }
  })();
  true;
`;
