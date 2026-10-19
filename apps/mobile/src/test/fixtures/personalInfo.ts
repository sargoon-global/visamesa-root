import type {PersonalInfo} from '@/features/profile/utils/parsePersonalInfo';

export const completePersonalInfo: PersonalInfo = {
  firstName: 'Test',
  lastName: 'User',
  secondLastName: '',
  gender: 'male',
  dateOfBirth: '1990-01-15',
  cityOfBirth: 'Paris',
  countryOfBirth: 'France',
  nationality: 'French',
  maritalStatus: 'single',
  fatherName: 'Father User',
  motherName: 'Mother User',
  nieNumber: 'Y1234567X',
  passportNumber: 'AB123456',
  phoneNumber: {countryCode: '34', number: '600123456'},
  streetType: 'Carrer',
  address: 'Example',
  addressNumber: '10',
  addressFloor: '',
  city: 'Barcelona',
  province: 'Barcelona',
  postalCode: '08001',
  email: 'test@example.com',
  hasEmpadronamiento: 'yes',
  empadronamientoIssuedAt: '2026-01-01',
};

export const completePersonalRecord: Record<string, unknown> = {
  ...completePersonalInfo,
};
