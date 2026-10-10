export const buildModelo790FillFormScript = (profile = {}) => {
  const documentNumber = JSON.stringify(profile.documentNumber ?? '');
  const fullName = JSON.stringify(profile.fullName ?? '');
  const address = profile.address ?? {};
  const streetType = JSON.stringify(address.streetType ?? '');
  const streetName = JSON.stringify(address.streetName ?? '');
  const number = JSON.stringify(address.number ?? '');
  const floor = JSON.stringify(address.floor ?? '');
  const door = JSON.stringify(address.door ?? '');
  const city = JSON.stringify(address.city ?? '');
  const province = JSON.stringify(address.province ?? '');
  const postalCode = JSON.stringify(address.postalCode ?? '');
  const phoneNumber = JSON.stringify(profile.phoneNumber ?? '');
  const feeInputId = JSON.stringify(profile.feeInputId ?? 'tasa5Input');
  const paymentMethod = profile.paymentMethod === 'debit' ? 'adeudo' : 'efectivo';

  return `
    (function() {
      const postDebug = data => {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'debug',
            data,
          }));
        } catch (error) {}
      };

      const postAutomationError = (title, message, detail) => {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            __visaMesaAutomationError: true,
            type: 'automation-error',
            payload: {
              title: title,
              message: message,
              detail: detail,
            },
          }));
        } catch (error) {}
      };

      const fillValue = (selector, value) => {
        const field = window.document.querySelector(selector);
        if (!field || value === '') {
          return false;
        }

        field.focus && field.focus();
        field.value = value;
        field.dispatchEvent(new Event('input', {bubbles: true}));
        field.dispatchEvent(new Event('change', {bubbles: true}));
        field.blur && field.blur();
        return true;
      };

      const selectRadio = selector => {
        const field = window.document.querySelector(selector);
        if (!field) {
          return false;
        }

        field.checked = true;
        field.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        field.dispatchEvent(new Event('input', {bubbles: true}));
        field.dispatchEvent(new Event('change', {bubbles: true}));

        if (window.jQuery) {
          window.jQuery(field).prop('checked', true).trigger('change');
        }

        return true;
      };

      postDebug('Modelo 790 fill script started at ' + window.location.href);

      fillValue('#nif', ${documentNumber});
      fillValue('#nombre', ${fullName});
      fillValue('#calle', ${streetType});
      fillValue('#via', ${streetName});
      fillValue('#numero', ${number});
      fillValue('#piso', ${floor});
      fillValue('#puerta', ${door});
      fillValue('#telefono', ${phoneNumber});
      fillValue('#municipio', ${city});
      fillValue('#provincia', ${province});
      fillValue('#codigoPostal', ${postalCode});
      fillValue('#localidad', ${city});

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      fillValue('#fecha', day + '/' + month + '/' + year);

      selectRadio('#' + ${feeInputId});
      selectRadio('#${paymentMethod}');

      window.validar790_012Resultado = '';

      if (typeof window.validarYCalcularImporteFinal === 'function') {
        window.validarYCalcularImporteFinal(false);
      } else {
        const feeField = window.document.querySelector('#' + ${feeInputId});
        const totalField = window.document.querySelector('#total');
        const selectedFee = feeField && feeField.getAttribute('tasa' + feeField.value + 'Importe');
        if (totalField && selectedFee) {
          totalField.value = selectedFee;
          totalField.dispatchEvent(new Event('input', {bubbles: true}));
          totalField.dispatchEvent(new Event('change', {bubbles: true}));
        }
      }

      const showCaptchaOnly = (retryMessage) => {
        const originalCaptchaField = window.document.querySelector('#codSeguridadForm');
        const captchaImage = window.document.querySelector('#divVisualCaptcha img');

        if (!originalCaptchaField || !captchaImage) {
          postAutomationError(
            'Modelo 790 captcha is unavailable',
            'The official site did not show the captcha needed to download the form. Please go back to the dashboard and try again later.',
            'Missing captcha elements',
          );
          return;
        }

        window.document.querySelector('#visaMesaModelo790CaptchaOnly')?.remove();

        const style = window.document.createElement('style');
        style.textContent = [
          'html, body {',
          '  overflow: hidden !important;',
          '  height: 100% !important;',
          '  background: #FFFFFF !important;',
          '}',
          'body > *:not(#visaMesaModelo790CaptchaOnly) {',
          '  visibility: hidden !important;',
          '}',
          '#visaMesaModelo790CaptchaOnly,',
          '#visaMesaModelo790CaptchaOnly * {',
          '  visibility: visible !important;',
          '}',
        ].join('\\n');

        const overlay = window.document.createElement('div');
        overlay.id = 'visaMesaModelo790CaptchaOnly';
        overlay.setAttribute('role', 'main');
        overlay.style.cssText = [
          'position: fixed',
          'inset: 0',
          'z-index: 2147483647',
          'display: flex',
          'align-items: center',
          'justify-content: center',
          'padding: 24px',
          'box-sizing: border-box',
          'background: #FFFFFF',
          'font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        ].join(';');

        const card = window.document.createElement('div');
        card.style.cssText = [
          'width: 100%',
          'max-width: 360px',
          'display: flex',
          'flex-direction: column',
          'align-items: stretch',
          'gap: 16px',
        ].join(';');

        const image = captchaImage.cloneNode(true);
        image.removeAttribute('width');
        image.removeAttribute('height');
        try {
          const src = new URL(captchaImage.getAttribute('src') || captchaImage.src, window.location.href);
          src.searchParams.set('_visaMesaRefresh', String(Date.now()));
          image.src = src.toString();
        } catch (error) {}
        image.style.cssText = 'max-width: 100%; height: auto; align-self: center;';

        const retryHint = window.document.createElement('div');
        retryHint.setAttribute('role', 'alert');
        retryHint.textContent = retryMessage || '';
        retryHint.style.cssText = [
          'display: ' + (retryMessage ? 'block' : 'none'),
          'color: #B42318',
          'font-size: 14px',
          'line-height: 20px',
          'text-align: center',
          'font-weight: 600',
        ].join(';');

        const input = window.document.createElement('input');
        input.type = 'text';
        input.inputMode = 'text';
        input.maxLength = 10;
        input.autocomplete = 'off';
        input.placeholder = 'Enter captcha';
        input.style.cssText = [
          'width: 100%',
          'height: 48px',
          'border: 1px solid #CBD5E1',
          'border-radius: 12px',
          'padding: 0 14px',
          'font-size: 18px',
          'box-sizing: border-box',
        ].join(';');

        const button = window.document.createElement('button');
        button.type = 'button';
        button.textContent = 'Download Modelo 790';
        button.style.cssText = [
          'width: 100%',
          'height: 48px',
          'border: 0',
          'border-radius: 999px',
          'background: #1A73E8',
          'color: #FFFFFF',
          'font-size: 16px',
          'font-weight: 700',
        ].join(';');
        const syncCaptcha = () => {
          originalCaptchaField.value = input.value.trim();
          originalCaptchaField.dispatchEvent(new Event('input', {bubbles: true}));
          originalCaptchaField.dispatchEvent(new Event('change', {bubbles: true}));
        };

        const postPdf = (base64) => {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            __visaMesaModelo790Pdf: true,
            type: 'modelo-790-pdf',
            payload: {
              base64: base64,
              fileName: 'modelo-790-012-' + Date.now() + '.pdf',
            },
          }));
        };

        const submitPdf = () => {
          if (button.disabled) {
            return;
          }
          syncCaptcha();
          button.disabled = true;
          button.textContent = 'Downloading…';
          window.document.querySelectorAll('#fondo0 input, #formapago input, #total').forEach(field => {
            field.removeAttribute('disabled');
          });

          const form = window.document.querySelector('#f_conc');
          if (!form) {
            postAutomationError(
              'Modelo 790 form unavailable',
              'The official form could not be submitted. Please go back to the dashboard and try again.',
              'Missing form',
            );
            return;
          }

          const fetchSubmittedForm = () => {
            const body = new URLSearchParams(new FormData(form));

            return fetch(form.action, {
              method: 'POST',
              body,
              credentials: 'include',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              },
            })
              .then(response => response.blob().then(blob => ({response, blob})))
              .then(({response, blob}) => {
                const contentType = response.headers.get('content-type') || blob.type || '';

                if (!response.ok) {
                  postAutomationError(
                    'Modelo 790 could not be downloaded',
                    'The official site returned an error. Please go back to the dashboard and try again later.',
                    'HTTP ' + response.status,
                  );
                  button.disabled = false;
                  button.textContent = 'Download Modelo 790';
                  return;
                }

                if (contentType.indexOf('pdf') !== -1) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const result = String(reader.result || '');
                    const base64 = result.slice(result.indexOf(',') + 1);
                    button.textContent = 'Opening PDF…';
                    postPdf(base64);
                  };
                  reader.onerror = () => postAutomationError(
                    'Modelo 790 could not be downloaded',
                    'The PDF could not be read. Please go back to the dashboard and try again.',
                    'FileReader failed',
                  );
                  reader.readAsDataURL(blob);
                  return;
                }

                return blob.text().then(html => {
                  window.document.open();
                  window.document.write(html);
                  window.document.close();

                  const hasCaptchaField = Boolean(window.document.querySelector('#codSeguridadForm'));
                  const hasCaptchaImage = Boolean(window.document.querySelector('#divVisualCaptcha img'));
                  const officialMessage = String(window.document.querySelector('#alertaCabecera, #alertaPie')?.textContent || '');

                  if (
                    hasCaptchaField &&
                    hasCaptchaImage
                  ) {
                    const retryMessage = /captcha/i.test(officialMessage)
                      ? 'Captcha was not accepted. Please try the new code.'
                      : undefined;
                    showCaptchaOnly(retryMessage);
                    return;
                  }

                  postAutomationError(
                    'Modelo 790 could not be downloaded',
                    'The official site did not return a PDF or a new captcha. Please go back to the dashboard and try again later.',
                    contentType || 'Unexpected response',
                  );
                });
              })
              .catch(error => {
                postAutomationError(
                  'Modelo 790 could not be downloaded',
                  'The official site request failed. Please go back to the dashboard and try again later.',
                  String(error && error.message ? error.message : error),
                );
                button.disabled = false;
                button.textContent = 'Download Modelo 790';
              });
          };

          if (typeof window.validar790_012 === 'function') {
            const originalSubmit = form.submit;
            const originalPrototypeSubmit = window.HTMLFormElement && window.HTMLFormElement.prototype.submit;
            const originalAlert = window.alert;
            let submittedByOfficialValidator = false;

            const restoreOfficialHooks = () => {
              form.submit = originalSubmit;
              if (originalPrototypeSubmit) {
                window.HTMLFormElement.prototype.submit = originalPrototypeSubmit;
              }
              window.alert = originalAlert;
            };
            const interceptSubmit = () => {
              submittedByOfficialValidator = true;
              restoreOfficialHooks();
              fetchSubmittedForm();
            };

            form.submit = interceptSubmit;
            if (originalPrototypeSubmit) {
              window.HTMLFormElement.prototype.submit = function() {
                if (this === form) {
                  interceptSubmit();
                  return;
                }
                return originalPrototypeSubmit.apply(this, arguments);
              };
            }
            window.alert = message => {
              restoreOfficialHooks();
              button.disabled = false;
              button.textContent = 'Download Modelo 790';
              postAutomationError(
                'Modelo 790 form could not be submitted',
                'The official form validation failed. Please go back to the dashboard and check your profile.',
                String(message || ''),
              );
            };
            window.validar790_012();
            if (!submittedByOfficialValidator) {
              restoreOfficialHooks();
              button.disabled = false;
              button.textContent = 'Download Modelo 790';
            }
          } else {
            window.document.querySelectorAll('#fondo0 input, #formapago input, #total').forEach(field => {
              field.removeAttribute('disabled');
            });
            fetchSubmittedForm();
          }
        };

        button.addEventListener('click', submitPdf);

        card.appendChild(image);
        card.appendChild(retryHint);
        card.appendChild(input);
        card.appendChild(button);
        overlay.appendChild(style);
        overlay.appendChild(card);
        window.document.body.appendChild(overlay);
        input.focus();
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'modelo-790-captcha-ready',
          }));
        } catch (error) {}
      };

      const requiredSelectors = [
        '#nif',
        '#nombre',
        '#calle',
        '#via',
        '#numero',
        '#telefono',
        '#municipio',
        '#provincia',
        '#codigoPostal',
        '#localidad',
        '#fecha',
        '#total',
      ];
      const missingValues = requiredSelectors.filter(selector => {
        const field = window.document.querySelector(selector);
        return !field || String(field.value || '').trim() === '';
      });
      const selectedFee = window.document.querySelector('input[name="tramiteSeleccionado"]:checked');
      const selectedPayment = window.document.querySelector('input[name="efectivoOAdeudo"]:checked');

      if (missingValues.length === 0 && selectedFee && selectedPayment) {
        showCaptchaOnly();
        postDebug('Modelo 790 form filled. Captcha overlay shown.');
      } else {
        postAutomationError(
          'Modelo 790 form could not be prepared',
          'Some required fields on the official form could not be filled. Please go back to the dashboard and check your profile.',
          missingValues.join(', ') || 'Fee or payment selection unavailable',
        );
      }
    })();
    true;
  `;
};
