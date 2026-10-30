export const CLAVE_URL =
  'https://icp.administracionelectronica.gob.es/icpco/acInfo';

export const CLAVE_SCRIPT = `
  (function() {
    const sinClaveButton = window.document.querySelector('#btnEntrar');

    if (sinClaveButton) {
      sinClaveButton.click();
    }
  })();
  true;
`;
