export const SELECT_OFICINA_SCRIPT = `
  (function() {
    const submit = () => {
      document.querySelector('button[type="submit"]').click();
    };
    const postSelection = payload => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'empadronamiento-selection',
        payload,
      }));
    };
    const selectOffice = () => {
      const office = document.querySelector('#OAC-DR');
      if (!office) {
        return;
      }

      const label = document.querySelector('label[for="OAC-DR"]');
      const officeName = String(
        label?.textContent || office.getAttribute('aria-label') || office.value || 'OAC-DR',
      ).replace(/\\s+/g, ' ').trim();

      sessionStorage.setItem('__visaMesaEmpadronamientoOffice', officeName);
      postSelection({office: officeName});
      office.click();
      submit();
    };

    selectOffice();
  })();
  true;
`;
