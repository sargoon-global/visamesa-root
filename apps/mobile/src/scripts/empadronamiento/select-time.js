export const SELECT_TIME_SCRIPT = `
  (function() {
    function pickFirstTimeAfter(minTime = '10:00') {
      const toMinutes = t => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const min = toMinutes(minTime);

      const times = [
        ...document.querySelectorAll('input[type="radio"][name="hora"][aria-label]'),
      ]
        .map(input => ({
          input,
          time: input.getAttribute('aria-label'),
          minutes: toMinutes(input.getAttribute('aria-label')),
        }))
        .filter(item => item.minutes >= min)
        .sort((a, b) => a.minutes - b.minutes);

      if (!times.length) return false;

      sessionStorage.setItem('__visaMesaEmpadronamientoTime', times[0].time);
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'empadronamiento-selection',
        payload: {time: times[0].time},
      }));
      times[0].input.click();
      submit();
      return true;
    }
    const submit = () => {
      document.querySelector('button[type="submit"]').click();
    };
    pickFirstTimeAfter('10:00');
  })();
  true;
`;
