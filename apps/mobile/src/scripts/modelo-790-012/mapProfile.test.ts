import {completePersonalInfo} from '@/test/fixtures/personalInfo';

import {toModelo790} from './mapProfile';

describe('toModelo790', () => {
  it('maps validated personal info into the official form shape', () => {
    expect(toModelo790(completePersonalInfo)).toEqual({
      documentNumber: 'Y1234567X',
      fullName: 'Test User',
      address: {
        streetType: 'Carrer',
        streetName: 'Example',
        number: '10',
        floor: '',
        door: '',
        city: 'Barcelona',
        province: 'Barcelona',
        postalCode: '08001',
      },
      phoneNumber: '+34 600123456',
      feeInputId: 'tasa5Input',
      paymentMethod: 'cash',
    });
  });

  it('caps the phone value at 15 characters for the official field', () => {
    expect(
      toModelo790({
        ...completePersonalInfo,
        phoneNumber: {countryCode: '34', number: '6001234567890'},
      }).phoneNumber,
    ).toHaveLength(15);
  });
});
