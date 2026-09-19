import type {ProfileData} from '@/features/profile/types/ProfileData';

export const completeEx17Personal = {
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
  postalCode: '08001',
  email: 'juan@example.com',
};

export const completeEx17Profile: ProfileData = {
  personal: completeEx17Personal,
};
