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
