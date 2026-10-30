export const ICP_PLUS_URL =
  'https://icp.administracionelectronica.gob.es/icpplustieb/index.html?appVersion=V+7.53';

export const LEGACY_ICP_PLUS_GATEWAY_URL =
  'https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus';

export const INITIAL_PAGE_SCRIPT = `
  (function() {
    const gatewayUrl =
      'https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus';

    if (window.location.href !== gatewayUrl) {
      return;
    }

    const submit = window.document.querySelector('#submit');
    if (submit) {
      submit.click();
    }
  })();
  true;
`;
