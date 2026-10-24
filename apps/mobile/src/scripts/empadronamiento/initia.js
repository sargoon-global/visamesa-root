export const EMPADRONAMIENTO_HOME_URL =
  'https://seuelectronica.ajuntament.barcelona.cat/oficinavirtual/ca';

export const INITIA_SCRIPT = `
  (function() {
    const selector =
      'a[href*="/oficinavirtual/ca/search-result"][href*="idCategory=21"]';

    window.document.querySelector(selector)?.click();
  })();
  true;
`;
