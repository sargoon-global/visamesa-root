export const SELECT_OFICINA_SCRIPT = `
  (function() {
    const postMessage = (type, payload) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({type, payload}));
    };
    const submit = () => {
      const submitControl =
        document.querySelector('button[type="submit"]') ||
        document.querySelector('input[type="submit"]') ||
        Array.from(document.querySelectorAll('button, [role="button"]')).find(button =>
          /continuar|siguiente|següent|next/i.test(button.textContent || button.getAttribute('aria-label') || ''),
        );

      if (!submitControl || submitControl.disabled || submitControl.getAttribute('aria-disabled') === 'true') {
        postMessage('empadronamiento-error', {
          code: 'office_continue_unavailable',
        });
        return false;
      }

      submitControl.click();
      return true;
    };
    const selectOffice = () => {
      const office =
        document.querySelector('input[type="radio"][name="oficinas"]') ||
        document.querySelector('#OAC-DR');
      if (!office) {
        return false;
      }

      const label = office.id
        ? document.querySelector('label[for="' + office.id + '"]')
        : null;
      const officeName = String(
        label?.textContent ||
          office.getAttribute('aria-label') ||
          office.value ||
          office.id ||
          'office',
      ).replace(/\\s+/g, ' ').trim();

      office.checked = true;
      office.dispatchEvent(new Event('input', {bubbles: true}));
      office.dispatchEvent(new Event('change', {bubbles: true}));
      office.click();
      sessionStorage.setItem('__visaMesaEmpadronamientoOffice', officeName);
      postMessage('empadronamiento-selection', {office: officeName});
      submit();
      return true;
    };

    if (!selectOffice()) {
      postMessage('empadronamiento-error', {
        code: 'office_selector_unavailable',
      });
    }
  })();
  true;
`;
