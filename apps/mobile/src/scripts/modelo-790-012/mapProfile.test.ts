import {mapProfileToModelo790} from './mapProfile';

const personal = {
  firstName: 'Test',
  lastName: 'User',
  nieNumber: 'Y1234567X',
  phoneNumber: {countryCode: '+34', number: '600 123 456'},
  address: 'Carrer Example',
  addressNumber: '10',
  city: 'Barcelona',
  province: 'Barcelona',
  postalCode: '08001',
};

describe('mapProfileToModelo790', () => {
  it('maps real profile fields without inserting fake contact information', () => {
    expect(mapProfileToModelo790(personal)).toEqual({
      documentNumber: 'Y1234567X',
      fullName: 'Test User',
      address: {
        streetType: 'Carrer',
        streetName: 'Example',
        number: '10',
        floor: '',
        city: 'Barcelona',
        province: 'Barcelona',
        postalCode: '08001',
      },
      phoneNumber: '600123456',
      feeInputId: 'tasa5Input',
      paymentMethod: 'cash',
    });
  });

  it('maps compact legacy Spanish phone strings', () => {
    expect(mapProfileToModelo790({...personal, phoneNumber: '34600123456'})).toEqual(
      expect.objectContaining({phoneNumber: '600123456'}),
    );
  });

  it('rejects missing fields and non-Spanish phone numbers instead of using placeholders', () => {
    expect(mapProfileToModelo790(null)).toBeNull();
    expect(mapProfileToModelo790({...personal, nieNumber: ''})).toBeNull();
    expect(mapProfileToModelo790({...personal, address: 'Example'})).toBeNull();
    expect(mapProfileToModelo790({...personal, phoneNumber: {countryCode: '+33', number: '600123456'}})).toBeNull();
  });
});
