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
  (function() {
    if (window.__visaMesaEmpadronamientoPdfDownloadStarted) {
      return;
    }
    window.__visaMesaEmpadronamientoPdfDownloadStarted = true;

    const cleanText = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const code = document.body?.innerText.match(
      /(?:c[oó]digo|codi)\\s*(?:de la cita|de cita)?\\s*:?\\s*(\\d{5,})/i,
    )?.[1] || 'confirmation';
    let sent = false;

    const postError = detail => {
      if (sent) return;
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'empadronamiento-error',
        payload: {
          title: 'Appointment PDF could not be downloaded',
          message: 'The official confirmation PDF could not be downloaded. Please try again later.',
          detail,
        },
      }));
    };
    const postPdf = async buffer => {
      if (sent || !buffer) return;
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      if (bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') {
        postError('The official response was not a PDF.');
        return;
      }
      sent = true;
      let binary = '';
      const chunkSize = 0x8000;
      for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
      }
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        __visaMesaEmpadronamientoPdf: true,
        payload: {
          base64: btoa(binary),
          fileName: 'empadronamiento-cita-' + code + '.pdf',
        },
      }));
    };
    const matchesPdfRequest = url => /generate-document|justificant|pdf/i.test(String(url || ''));

    const originalWindowOpen = window.open;
    window.open = function(url, ...args) {
      if (matchesPdfRequest(url)) {
        fetch(url, {credentials: 'include'})
          .then(response => response.arrayBuffer())
          .then(postPdf)
          .catch(error => postError(String(error)));
        return null;
      }
      return originalWindowOpen.call(this, url, ...args);
    };

    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (matchesPdfRequest(url)) {
          response.clone().arrayBuffer().then(postPdf).catch(error => postError(String(error)));
        }
        return response;
      });
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this.__visaMesaPdfUrl = url;
      return originalOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      if (matchesPdfRequest(this.__visaMesaPdfUrl)) {
        this.addEventListener('load', () => {
          const response = this.response;
          if (response instanceof ArrayBuffer) {
            postPdf(response);
          } else if (response instanceof Blob) {
            response.arrayBuffer().then(postPdf).catch(error => postError(String(error)));
          } else if (typeof this.responseText === 'string' && this.responseText) {
            const text = this.responseText;
            if (!text.startsWith('%PDF-')) {
              postError('The official response was not a PDF.');
              return;
            }
            const bytes = new Uint8Array(text.length);
            for (let index = 0; index < text.length; index += 1) {
              bytes[index] = text.charCodeAt(index) & 0xff;
            }
            postPdf(bytes);
          } else {
            postError('The official PDF response was empty.');
          }
        });
        this.addEventListener('error', () => postError('The official PDF request failed.'));
      }
      return originalSend.apply(this, args);
    };

    const link = document.querySelector('a[href*=".pdf" i]');
    if (link?.href) {
      fetch(link.href, {credentials: 'include'}).then(response => response.arrayBuffer()).then(postPdf).catch(error => postError(String(error)));
      return;
    }

    const downloadControl = Array.from(document.querySelectorAll('.dates-content, [role="button"], button')).find(element =>
      /justificant|justificante|download|descargue/i.test(cleanText(element.textContent)),
    );
    if (!downloadControl) {
      postError('The official download control was not found.');
      return;
    }
    downloadControl.click();
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
