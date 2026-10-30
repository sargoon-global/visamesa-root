export const SOLICITAR_CITA_URL =
  'https://icp.administracionelectronica.gob.es/icpco/acValidarEntrada';

export const SOLICITAR_CITA_SCRIPT = `
  (function() {
    const sendButton = window.document.querySelector('#btnEnviar');

    if (sendButton) {
      sendButton.click();
    }
  })();
  true;
`;
