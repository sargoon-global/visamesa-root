export const APPOINTMENT_FINAL_URL =
  'https://icp.administracionelectronica.gob.es/icpplustieb/acGrabarCita';

export const APPOINTMENT_FINAL_SCRIPT = `
  (function() {
    const cleanText = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const normalize = value => cleanText(value).toUpperCase();
    const postMessage = (type, payload) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({type, payload}));
    };

    const textAfterLabel = pattern => {
      const labels = Array.from(document.querySelectorAll('.fld .label'));
      const label = labels.find(element => pattern.test(cleanText(element.textContent)));
      if (!label) {
        return '';
      }
      const container = label.closest('.fld');
      return cleanText(container?.querySelector('.mf-psdinput')?.textContent);
    };

    const reference = cleanText(document.querySelector('#justificanteFinal')?.textContent);
    const confirmed = normalize(document.body?.innerText).includes('CITA CONFIRMADA');

    if (!reference || !confirmed) {
      return;
    }

    if (window.__visaMesaCitaPreviaCompletionPosted === reference) {
      return;
    }

    window.__visaMesaCitaPreviaCompletionPosted = reference;
    postMessage('cita-previa-booking-complete', {
      office: textAfterLabel(/DIRECCION|DIRECCIÓN/i),
      date: textAfterLabel(/DIA DE LA CITA|DÍA DE LA CITA/i),
      time: textAfterLabel(/HORA CITA/i),
      location: textAfterLabel(/DIRECCION|DIRECCIÓN/i),
      confirmationCode: reference,
    });
  })();
  true;
`;
