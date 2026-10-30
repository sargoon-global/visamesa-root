export const SLOT_PICKER_URL =
  'https://icp.administracionelectronica.gob.es/icpco/acOfertarCita';

export const SLOT_PICKER_SCRIPT = `
  (function() {
    const normalize = value =>
      String(value || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/\\s+/g, ' ')
        .trim()
        .toUpperCase();

    const postMessage = (type, payload) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({type, payload}));
    };

    const getDialog = () =>
      Array.from(document.querySelectorAll('.jconfirm, .jconfirm-box, [role="dialog"]'))
        .find(dialog => {
          const text = normalize(dialog.textContent);
          return (
            text.includes('VAS A RESERVAR LA CITA SELECCIONADA') &&
            text.includes('ESTAS SEGURO')
          );
        });

    const clickDialogYes = dialog => {
      const button = Array.from(
        dialog.querySelectorAll('button, input[type="button"], input[type="submit"]'),
      ).find(candidate => /^SI$/i.test(normalize(candidate.textContent || candidate.value)));
      if (!button) {
        return false;
      }
      button.click();
      return true;
    };

    const selectFirstAvailableAppointment = () => {
      const selected = document.querySelector('input[name="rdbCita"]:checked');
      if (selected) {
        return selected;
      }

      const candidate = Array.from(
        document.querySelectorAll('input[name="rdbCita"]'),
      ).find(input => !input.disabled);
      if (!candidate) {
        return null;
      }

      candidate.click();
      candidate.checked = true;
      candidate.dispatchEvent(new Event('input', {bubbles: true}));
      candidate.dispatchEvent(new Event('change', {bubbles: true}));
      return candidate;
    };

    const continueWithCaptcha = () => {
      if (window.__visaMesaCitaPreviaSlotSubmitting) {
        return;
      }

      const captcha = document.querySelector('#captcha');
      const nextButton = document.querySelector('#btnSiguiente');
      const appointment = selectFirstAvailableAppointment();

      if (!captcha || !nextButton || !appointment || !captcha.value.trim()) {
        return;
      }

      window.__visaMesaCitaPreviaSlotSubmitting = true;
      const dialogObserver = new MutationObserver(() => {
        const dialog = getDialog();
        if (!dialog) {
          return;
        }

        dialogObserver.disconnect();
        if (!clickDialogYes(dialog)) {
          window.__visaMesaCitaPreviaSlotSubmitting = false;
          postMessage('cita-previa-error', {
            code: 'slot_confirmation_unavailable',
          });
        }
      });

      dialogObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });

      nextButton.click();

      const dialog = getDialog();
      if (dialog) {
        dialogObserver.disconnect();
        if (!clickDialogYes(dialog)) {
          window.__visaMesaCitaPreviaSlotSubmitting = false;
          postMessage('cita-previa-error', {
            code: 'slot_confirmation_unavailable',
          });
        }
      }
    };

    const captcha = document.querySelector('#captcha');
    if (!captcha) {
      return;
    }

    if (!window.__visaMesaCitaPreviaCaptchaBound) {
      window.__visaMesaCitaPreviaCaptchaBound = true;
      captcha.addEventListener('input', continueWithCaptcha);
      captcha.addEventListener('change', continueWithCaptcha);
    }

    if (captcha.value.trim()) {
      continueWithCaptcha();
    }
  })();
  true;
`;
