import {isEmpadronamientoMessage} from './messages';

describe('empadronamiento WebView messages', () => {
  it('accepts valid appointment messages', () => {
    expect(
      isEmpadronamientoMessage({
        type: 'empadronamiento-selection',
        payload: {office: 'Office', date: '2026-01-01'},
      }),
    ).toBe(true);
    expect(
      isEmpadronamientoMessage({
        type: 'empadronamiento-review-ready',
        payload: {time: '10:30'},
      }),
    ).toBe(true);
    expect(
      isEmpadronamientoMessage({
        type: 'empadronamiento-booking-complete',
        payload: {
          office: 'Office',
          date: '2026-01-01',
          time: '10:30',
          confirmationCode: 'ABC123',
        },
      }),
    ).toBe(true);
    expect(
      isEmpadronamientoMessage({type: 'empadronamiento-submit-started'}),
    ).toBe(true);
    expect(
      isEmpadronamientoMessage({
        type: 'empadronamiento-error',
        payload: {code: 'confirmation_unavailable'},
      }),
    ).toBe(true);
  });

  it('rejects malformed payloads and unrelated messages', () => {
    expect(
      isEmpadronamientoMessage({
        type: 'empadronamiento-booking-complete',
        payload: {office: {invalid: true}},
      }),
    ).toBe(false);
    expect(
      isEmpadronamientoMessage({
        type: 'empadronamiento-error',
        payload: {code: 'unknown'},
      }),
    ).toBe(false);
    expect(isEmpadronamientoMessage({type: 'debug'})).toBe(false);
    expect(isEmpadronamientoMessage(null)).toBe(false);
  });
});
