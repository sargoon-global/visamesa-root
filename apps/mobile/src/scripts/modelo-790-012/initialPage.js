export const MODELO_790_012_ENTRY_URL =
  'https://sede.policia.gob.es/Tasa790_012/';

export const MODELO_790_012_FORM_URL =
  'https://sede.policia.gob.es/Tasa790_012/ImpresoRellenar';

// Start directly on the fill form. The landing page only contains a link to this URL,
// so skipping it removes one fragile WebView navigation step.
export const MODELO_790_012_START_URL = MODELO_790_012_FORM_URL;

export const MODELO_790_012_INITIAL_PAGE_SCRIPT = `
  (function() {
    const formLink = window.document.querySelector('a[href="ImpresoRellenar"], a[href$="/ImpresoRellenar"]');

    if (formLink) {
      formLink.click();
    }
  })();
  true;
`;
