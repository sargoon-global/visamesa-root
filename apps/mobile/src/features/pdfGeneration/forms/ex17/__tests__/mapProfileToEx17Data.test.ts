import {
  completeEx17Personal,
  completeEx17Profile,
} from '@/features/pdfGeneration/forms/ex17/__tests__/fixtures/completeEx17Profile';
import {mapProfileToEx17Data} from '@/features/pdfGeneration/forms/ex17/mapProfileToEx17Data';

import type {ProfileData} from '@/features/profile/types/ProfileData';

describe('mapProfileToEx17Data', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-19T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('maps profile personal fields into EX-17 applicant and notification data', () => {
    const data = mapProfileToEx17Data(completeEx17Profile);

    expect(data).toMatchObject({
      applicant: {
        passportNumber: 'P12345678',
        nie: {prefix: 'X', number: '1234567', checkDigit: 'L'},
        firstName: 'JUAN',
        firstSurname: 'GARCIA',
        secondSurname: 'MARTINEZ',
        sex: 'H',
        birthDate: '1990-05-15',
        birthPlace: 'BUENOS AIRES',
        birthCountry: 'ARGENTINA',
        nationality: 'ARGENTINA',
        maritalStatus: 'single',
        fatherName: 'CARLOS GARCIA',
        motherName: 'MARIA MARTINEZ',
        mobilePhone: '+34 600123456',
        email: 'juan@example.com',
        address: {
          street: 'CALLE MAYOR',
          number: '10',
          floor: '3B',
          city: 'BARCELONA',
          postalCode: '08001',
          province: 'BARCELONA',
        },
      },
      notifications: {
        fullNameOrBusinessName: 'JUAN GARCIA MARTINEZ',
        documentNumber: 'X1234567L',
        email: 'juan@example.com',
      },
      signature: {
        place: 'BARCELONA',
        date: '2026-09-19',
      },
      destination: {
        province: 'BARCELONA',
      },
    });
  });

  it('maps gender values to EX-17 sex codes', () => {
    expect(
      mapProfileToEx17Data({personal: {...completeEx17Personal, gender: 'female'}})
        .applicant.sex,
    ).toBe('M');
    expect(
      mapProfileToEx17Data({personal: {...completeEx17Personal, gender: 'other'}})
        .applicant.sex,
    ).toBe('X');
  });

  it('leaves NIE parts empty when the NIE format is invalid', () => {
    const profile: ProfileData = {
      personal: {...completeEx17Personal, nieNumber: 'INVALID'},
    };

    expect(mapProfileToEx17Data(profile).applicant.nie).toEqual({
      prefix: '',
      number: '',
      checkDigit: '',
    });
  });
});
