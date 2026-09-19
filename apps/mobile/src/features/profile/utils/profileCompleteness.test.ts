import {isProfileComplete} from './profileCompleteness';
import {ProfileData} from '../types/ProfileData';

const completePersonal = {
  firstName: 'John',
  lastName: 'Doe',
  gender: 'male',
  dateOfBirth: '1995-05-01',
  cityOfBirth: 'New York',
  countryOfBirth: 'USA',
  nationality: 'USA',
  maritalStatus: 'single',
  fatherName: 'John Doe Sr',
  motherName: 'Jane Doe',
  nieNumber: 'X1234567A',
  passportNumber: 'P12345678',
  address: '123 Main St',
  addressNumber: '12',
  city: 'Barcelona',
  province: 'Barcelona',
  postalCode: '08001',
  email: 'john@example.com',
  phoneNumber: {countryCode: '+34', number: '600123456'},
  hasEmpadronamiento: 'no',
};

describe('isProfileComplete', () => {
  it('returns false for null profile data', () => {
    expect(isProfileComplete(null)).toBe(false);
  });

  it('returns false for null personal section', () => {
    const profileData: ProfileData = {personal: null};
    expect(isProfileComplete(profileData)).toBe(false);
  });

  it('returns false when required fields are missing', () => {
    const profileData: ProfileData = {
      personal: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };
    expect(isProfileComplete(profileData)).toBe(false);
  });

  it('returns false when phone number is incomplete', () => {
    const profileData: ProfileData = {
      personal: {
        ...completePersonal,
        phoneNumber: {countryCode: '+34', number: ''},
      },
    };
    expect(isProfileComplete(profileData)).toBe(false);
  });

  it('returns true when all required fields are present without empadronamiento date', () => {
    const profileData: ProfileData = {
      personal: completePersonal,
    };
    expect(isProfileComplete(profileData)).toBe(true);
  });

  it('requires empadronamiento date when user already has empadronamiento', () => {
    const profileData: ProfileData = {
      personal: {
        ...completePersonal,
        hasEmpadronamiento: 'yes',
      },
    };
    expect(isProfileComplete(profileData)).toBe(false);
  });

  it('returns true when empadronamiento date is provided', () => {
    const profileData: ProfileData = {
      personal: {
        ...completePersonal,
        hasEmpadronamiento: 'yes',
        empadronamientoIssuedAt: '2026-01-15',
      },
    };
    expect(isProfileComplete(profileData)).toBe(true);
  });
});
