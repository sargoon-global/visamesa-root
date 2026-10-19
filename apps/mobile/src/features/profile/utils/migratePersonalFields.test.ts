import {VISA_MESA_SUPPORTED_PROVINCE} from '@/features/profile/data/barcelonaScope';

import {migratePersonalFields} from './migratePersonalFields';

describe('migratePersonalFields', () => {
  it('sets province to the supported Barcelona scope', () => {
    expect(
      migratePersonalFields({firstName: 'Ada', province: 'Madrid'}).province,
    ).toBe(VISA_MESA_SUPPORTED_PROVINCE);
  });

  it('splits legacy floor and door values', () => {
    expect(
      migratePersonalFields({addressFloor: '6.4'}),
    ).toEqual({
      addressFloor: '6',
      addressDoor: '4',
      province: VISA_MESA_SUPPORTED_PROVINCE,
    });
  });

  it('splits street type prefix from a combined address', () => {
    expect(
      migratePersonalFields({address: 'Carrer Example 10'}),
    ).toMatchObject({
      streetType: 'Carrer',
      address: 'Example 10',
      province: VISA_MESA_SUPPORTED_PROVINCE,
    });
  });

  it('normalizes compact phone strings', () => {
    expect(
      migratePersonalFields({phoneNumber: '34600123456'}).phoneNumber,
    ).toEqual({
      countryCode: '34',
      number: '600123456',
    });
  });
});
