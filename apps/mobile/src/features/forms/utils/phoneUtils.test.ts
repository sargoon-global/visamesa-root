import {normalizePhone, phoneToString, stringToPhone} from './phoneUtils';

describe('phoneUtils', () => {
  it('normalizes phone objects to digits and keeps country code separate', () => {
    expect(normalizePhone({countryCode: '+34', number: '600 123 456'})).toEqual({
      countryCode: '34',
      number: '600123456',
    });
  });

  it('strips a duplicated country code from the local number', () => {
    expect(normalizePhone({countryCode: '34', number: '34600123456'})).toEqual({
      countryCode: '34',
      number: '600123456',
    });
  });

  it('parses legacy string values without merging country code into the number', () => {
    expect(stringToPhone('+34 600 123 456')).toEqual({
      countryCode: '34',
      number: '600123456',
    });
  });

  it('parses compact Spanish legacy strings into country code and local number', () => {
    expect(stringToPhone('34600123456')).toEqual({
      countryCode: '34',
      number: '600123456',
    });
  });

  it('formats normalized phone strings for legacy consumers', () => {
    expect(phoneToString({countryCode: '+34', number: '34600123456'})).toBe(
      '+34 600123456',
    );
  });
});
