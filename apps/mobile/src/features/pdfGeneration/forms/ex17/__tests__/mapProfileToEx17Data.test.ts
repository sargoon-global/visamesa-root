import {mapProfileToEx17Data} from '@/features/pdfGeneration/forms/ex17/mapProfileToEx17Data';

import type {ProfileData} from '@/features/profile/types/ProfileData';

const completePersonal = {
  firstName: 'Juan',
  lastName: 'Garcia',
  secondLastName: 'Martinez',
  gender: 'male',
  dateOfBirth: '1990-05-15',
  cityOfBirth: 'Buenos Aires',
  countryOfBirth: 'Argentina',
  nationality: 'Argentina',
  maritalStatus: 'single',
  fatherName: 'Carlos Garcia',
  motherName: 'Maria Martinez',
  nieNumber: 'X1234567L',
  passportNumber: 'P12345678',
  phoneNumber: {countryCode: '+34', number: '600123456'},
  address: 'Calle Mayor',
  addressNumber: '10',
  addressFloor: '3B',
  city: 'Barcelona',
  province: 'Barcelona',
  postalCode: '28013',
  email: 'juan@example.com',
};

describe('mapProfileToEx17Data', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-19T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('maps profile personal fields into EX-17 applicant and notification data', () => {
    const profile: ProfileData = {
      personal: completePersonal,
    };

    const data = mapProfileToEx17Data(profile);

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
          postalCode: '28013',
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

  it('maps legacy document fields when nie and passport numbers are missing', () => {
    const data = mapProfileToEx17Data({
      personal: {
        documentType: 'passport',
        documentNumber: 'LEGACY123',
      },
    });

    expect(data.applicant.passportNumber).toBe('LEGACY123');
    expect(data.applicant.nie).toEqual({
      prefix: '',
      number: '',
      checkDigit: '',
    });
  });

  it('maps gender values to EX-17 sex codes', () => {
    expect(
      mapProfileToEx17Data({personal: {...completePersonal, gender: 'female'}})
        .applicant.sex,
    ).toBe('M');
    expect(
      mapProfileToEx17Data({personal: {...completePersonal, gender: 'other'}})
        .applicant.sex,
    ).toBe('X');
  });
});
