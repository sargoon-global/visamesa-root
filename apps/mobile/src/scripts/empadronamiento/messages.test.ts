import {isEmpadronamientoMessage} from './messages';

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

  it('rejects unrelated messages', () => {
    expect(isEmpadronamientoMessage({type: 'debug'})).toBe(false);
    expect(isEmpadronamientoMessage(null)).toBe(false);
  });
});
