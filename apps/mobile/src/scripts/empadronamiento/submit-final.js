const APPOINTMENT_DETAIL_HELPERS = `
  const cleanText = value => String(value || '').replace(/\\s+/g, ' ').trim();
  const textAfterLabel = pattern => {
    const labels = Array.from(document.querySelectorAll('dt, th, label, strong, .label'));
    const label = labels.find(element => pattern.test(cleanText(element.textContent)));
    if (!label) {
      return '';
    }

    const value = label.nextElementSibling || label.parentElement?.querySelector('dd, td, .value');
    return cleanText(value?.textContent);
  };
  const findPdfLink = () => Array.from(document.querySelectorAll('a[href]')).find(link =>
    /pdf|justificant|justificante|download|descargue/i.test(
      cleanText(link.textContent) + ' ' + link.getAttribute('href'),
    ),
  );
  const readConfirmationCode = () => {
    const match = bodyText.match(/(?:c[oó]digo|codi)\\s*(?:de la cita|de cita)?\\s*:?\\s*(\\d{5,})/i);
    return match?.[1] || textAfterLabel(/codi|c[oó]digo|confirmation/i);
  };
  const readAppointment = () => ({
    office:
      textAfterLabel(/oficina|office|centre|centro/i) ||
      sessionStorage.getItem('__visaMesaEmpadronamientoOffice') ||
      '',
    date:
      textAfterLabel(/data|fecha|date/i) ||
      sessionStorage.getItem('__visaMesaEmpadronamientoDate') ||
      '',
    time:
      textAfterLabel(/hora|time/i) ||
      sessionStorage.getItem('__visaMesaEmpadronamientoTime') ||
      '',
    location: textAfterLabel(/adreça|direcci[oó]n|address/i),
    confirmationCode: readConfirmationCode(),
    pdfUrl: findPdfLink()?.href || '',
  });
  const postMessage = (type, payload) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify({type, payload}));
  };
  const findConfirmationButton = () =>
    document.querySelector('button[type="submit"]') ||
    Array.from(document.querySelectorAll('button')).find(button =>
      /confirmar|reservar|finalitzar|finalizar|confirm appointment/i.test(
        cleanText(button.textContent),
      ),
    );
  const bodyText = cleanText(document.body?.innerText);
  const successPattern = /cita.{0,40}(confirmada|reservada|concertada)|reserva.{0,40}(confirmada|realitzada)|appointment.{0,40}(confirmed|booked)/i;
`;

export const SUBMIT_FINAL_SCRIPT = `
  (function() {
    ${APPOINTMENT_DETAIL_HELPERS}

    if (successPattern.test(bodyText)) {
      postMessage('empadronamiento-booking-complete', readAppointment());
      return;
    }

    const submitButton = findConfirmationButton();
    if (!submitButton) {
      return;
    }

    if (!window.__visaMesaEmpadronamientoReviewPosted) {
      window.__visaMesaEmpadronamientoReviewPosted = true;
      postMessage('empadronamiento-review-ready', readAppointment());
    }
  })();
  true;
`;

export const CONFIRM_EMPADRONAMIENTO_SUBMIT_SCRIPT = `
  (function() {
    const cleanText = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const submitButton =
      document.querySelector('button[type="submit"]') ||
      Array.from(document.querySelectorAll('button')).find(button =>
        /confirmar|reservar|finalitzar|finalizar|confirm appointment/i.test(
          cleanText(button.textContent),
        ),
      );
    if (!submitButton || submitButton.disabled) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'empadronamiento-error',
        payload: {
          title: 'Appointment could not be confirmed',
          message: 'The official confirmation button is unavailable. Please go back to the dashboard and try again.',
        },
      }));
      return;
    }

    window.ReactNativeWebView?.postMessage(JSON.stringify({
      type: 'empadronamiento-submit-started',
    }));
    submitButton.click();
  })();
  true;
`;

export const DOWNLOAD_EMPADRONAMIENTO_PDF_SCRIPT = `
  (async function() {
    const link = Array.from(document.querySelectorAll('a[href]')).find(anchor =>
      /pdf|justificant|justificante|download|descargue/i.test(
        String(anchor.textContent || '') + ' ' + anchor.getAttribute('href'),
      ),
    );
    if (!link?.href) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'empadronamiento-error',
        payload: {
          title: 'Appointment PDF unavailable',
          message: 'The official confirmation PDF could not be found. Please try again from the dashboard.',
        },
      }));
      return;
    }

    try {
      const response = await fetch(link.href, {credentials: 'include'});
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 0x8000;
      for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
      }
      const base64 = btoa(binary);
      if (!base64.startsWith('JVBERi0')) {
        throw new Error('The official response was not a PDF');
      }
      const code = (document.body?.innerText || '').match(/(?:c[oó]digo|codi)\\s*(?:de la cita|de cita)?\\s*:?\\s*(\\d{5,})/i)?.[1] || 'confirmation';
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        __visaMesaEmpadronamientoPdf: true,
        payload: {
          base64,
          fileName: 'empadronamiento-cita-' + code + '.pdf',
        },
      }));
    } catch (error) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'empadronamiento-error',
        payload: {
          title: 'Appointment PDF could not be downloaded',
          message: 'The official confirmation PDF could not be downloaded. Please try again later.',
          detail: String(error?.message || error),
        },
      }));
    }
  })();
  true;
`;

export const EMPADRONAMIENTO_RESULT_SCRIPT = `
  (function() {
    ${APPOINTMENT_DETAIL_HELPERS}

    if (successPattern.test(bodyText)) {
      postMessage('empadronamiento-booking-complete', readAppointment());
      return;
    }

    const submitButton = findConfirmationButton();
    if (submitButton && !window.__visaMesaEmpadronamientoReviewPosted) {
      window.__visaMesaEmpadronamientoReviewPosted = true;
      postMessage('empadronamiento-review-ready', readAppointment());
    }
  })();
  true;
`;
