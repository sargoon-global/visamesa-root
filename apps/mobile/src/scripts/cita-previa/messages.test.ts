import {isCitaPreviaMessage} from './messages';

describe('Cita Previa WebView messages', () => {
  it('accepts a complete booking payload', () => {
    expect(
      isCitaPreviaMessage({
        type: 'cita-previa-booking-complete',
        payload: {
          office: 'Office',
          date: '04/11/2026',
          time: '09:15',
          confirmationCode: '3584AX7F',
        },
      }),
    ).toBe(true);
  });

  it('rejects malformed completion payloads', () => {
    expect(
      isCitaPreviaMessage({
        type: 'cita-previa-booking-complete',
        payload: {confirmationCode: 123},
      }),
    ).toBe(false);
  });

  it('accepts only known automation errors', () => {
    expect(
      isCitaPreviaMessage({
        type: 'cita-previa-error',
        payload: {code: 'slot_confirmation_unavailable'},
      }),
    ).toBe(true);
    expect(
      isCitaPreviaMessage({
        type: 'cita-previa-error',
        payload: {code: 'unknown'},
      }),
    ).toBe(false);
  });
});
