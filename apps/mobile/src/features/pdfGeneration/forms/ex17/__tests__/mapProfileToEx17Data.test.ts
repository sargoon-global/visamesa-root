import {
  completeEx17Personal,
} from '@/features/pdfGeneration/forms/ex17/__tests__/fixtures/completeEx17Profile';
import {mapProfileToEx17Data} from '@/features/pdfGeneration/forms/ex17/mapProfileToEx17Data';
import {parsePersonalInfo} from '@/features/profile/utils/parsePersonalInfo';

function mapEx17FromRecord(personal: Record<string, unknown>) {
  const parsed = parsePersonalInfo(personal);
  if (!parsed.ok) {
    throw new Error('Fixture personal info is incomplete');
  }
  return mapProfileToEx17Data(parsed.data);
}

describe('mapProfileToEx17Data', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-19T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('maps profile personal fields into EX-17 applicant and notification data', () => {
    const data = mapEx17FromRecord(completeEx17Personal);

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
      mapEx17FromRecord({...completeEx17Personal, gender: 'female'}).applicant.sex,
    ).toBe('M');
    expect(
      mapEx17FromRecord({...completeEx17Personal, gender: 'other'}).applicant.sex,
    ).toBe('X');
  });

  it('leaves NIE parts empty when the NIE format is invalid', () => {
    const parsed = parsePersonalInfo(completeEx17Personal);
    if (!parsed.ok) {
      throw new Error('Fixture personal info is incomplete');
    }

    expect(
      mapProfileToEx17Data({...parsed.data, nieNumber: 'INVALID'}).applicant.nie,
    ).toEqual({
      prefix: '',
      number: '',
      checkDigit: '',
    });
  });
});
