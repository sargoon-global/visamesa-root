import {isEmpadronamientoMessage, isEmpadronamientoPdf} from './messages';

describe('empadronamiento WebView messages', () => {
  it.each([
    'empadronamiento-selection',
    'empadronamiento-review-ready',
    'empadronamiento-submit-started',
    'empadronamiento-booking-complete',
    'empadronamiento-error',
  ])('accepts %s messages', type => {
    expect(isEmpadronamientoMessage({type, payload: {time: '10:30'}})).toBe(
      true,
    );
  });

  it('accepts a valid PDF handoff', () => {
    expect(
      isEmpadronamientoPdf({
        __visaMesaEmpadronamientoPdf: true,
        payload: {
          base64: 'JVBERi0xLjQ=',
          fileName: 'empadronamiento-cita-16723164.pdf',
        },
      }),
    ).toBe(true);
  });

  it('rejects unrelated messages', () => {
    expect(isEmpadronamientoMessage({type: 'debug'})).toBe(false);
    expect(isEmpadronamientoMessage(null)).toBe(false);
  });
});
