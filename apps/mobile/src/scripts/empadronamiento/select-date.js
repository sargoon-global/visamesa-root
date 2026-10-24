export const SELECT_DATE_SCRIPT = `
  (function() {
    function nextWeekday(from = new Date()) {
      const d = new Date(from);
      d.setHours(0, 0, 0, 0);

      const day = d.getDay();
      if (day === 5) d.setDate(d.getDate() + 3);
      else if (day === 6) d.setDate(d.getDate() + 2);
      else d.setDate(d.getDate() + 1);

      return d;
    }

    const observeUntil = condition => {
      if (condition()) {
        return;
      }

      const observer = new MutationObserver(() => {
        if (condition()) {
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'class', 'aria-disabled'],
      });
    };

    const submitWhenReady = () => {
      observeUntil(() => {
        const button =
          document.querySelector('button[type="submit"]') ||
          Array.from(document.querySelectorAll('button')).find(button =>
            /següent|continuar/i.test(button.textContent || ''),
          );

        if (!button || button.disabled) {
          return false;
        }

        button.click();
        return true;
      });
    };

    const months = {
      gener: 0,
      enero: 0,
      febrer: 1,
      febrero: 1,
      març: 2,
      marzo: 2,
      abril: 3,
      maig: 4,
      mayo: 4,
      juny: 5,
      junio: 5,
      juliol: 6,
      julio: 6,
      agost: 7,
      agosto: 7,
      setembre: 8,
      septiembre: 8,
      octubre: 9,
      novembre: 10,
      noviembre: 10,
      desembre: 11,
      diciembre: 11,
    };

    function parseDateLabel(label) {
      const normalized = (label || '')
        .replace(/\\u00a0/g, ' ')
        .replace(/[’']/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim()
        .toLowerCase();
      const match = normalized.match(
        /(\\d{1,2})\\s+d(?:e)?\\s+([a-zà-ÿ]+)\\s+d(?:e|el)\\s+(\\d{4})/i,
      );
      if (!match) return null;

      const [, day, monthName, year] = match;
      const month = months[monthName];
      if (month === undefined) return null;

      return new Date(Number(year), month, Number(day));
    }

    function isDisabled(element) {
      const className = String(element.className || '');
      return (
        className.includes('disabled') ||
        element.disabled ||
        element.getAttribute('aria-disabled') === 'true'
      );
    }

    function isVisible(element) {
      return Boolean(element && (element.offsetParent || element.getClientRects().length));
    }

    function calendarCells() {
      return [
        ...document.querySelectorAll('mat-calendar td[role="button"][aria-label]'),
      ].filter(isVisible);
    }

    function calendarSignature() {
      return calendarCells()
        .map(cell => cell.getAttribute('aria-label'))
        .join('|');
    }

    function findNextMonthButton() {
      return Array.from(document.querySelectorAll('button')).find(button =>
        /següent|siguiente|next/i.test(button.getAttribute('aria-label') || ''),
      );
    }

    function waitForCalendarChange(previousSignature, onChange) {
      const calendar = document.querySelector('mat-calendar') || document.documentElement;
      const observer = new MutationObserver(() => {
        if (calendarSignature() !== previousSignature) {
          observer.disconnect();
          onChange();
        }
      });
      observer.observe(calendar, {childList: true, subtree: true, attributes: true});
    }

    function pickFirstAvailableDate(monthChanges = 0) {
      const minDate = nextWeekday();
      const cells = calendarCells();

      const availableCells = cells
        .filter(cell => !isDisabled(cell))
        .map(cell => ({
          cell,
          date: parseDateLabel(cell.getAttribute('aria-label')),
        }))
        .filter(item => item.date && item.date >= minDate)
        .sort((a, b) => a.date - b.date);

      if (availableCells.length) {
        const selected = availableCells[0];
        const selectedDate =
          selected.cell.getAttribute('aria-label') || selected.date.toLocaleDateString();
        sessionStorage.setItem('__visaMesaEmpadronamientoDate', selectedDate);
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'empadronamiento-selection',
          payload: {date: selectedDate},
        }));
        selected.cell.click();
        submitWhenReady();
        return true;
      }

      const nextMonthButton = findNextMonthButton();
      if (
        cells.length &&
        nextMonthButton &&
        !isDisabled(nextMonthButton) &&
        monthChanges < 6
      ) {
        const previousSignature = calendarSignature();
        waitForCalendarChange(previousSignature, () =>
          pickFirstAvailableDate(monthChanges + 1),
        );
        nextMonthButton.click();
        return false;
      }

      return false;
    }

    observeUntil(() => pickFirstAvailableDate());
  })();
  true;
`;
