import type {TieStepSlug} from '@visamesa/content/tieSteps/detail';

import type {PersonalInfo} from '@/features/profile/utils/parsePersonalInfo';

export const STEP_PROFILE_DEPENDENCIES: Record<
  TieStepSlug,
  readonly (keyof PersonalInfo)[]
> = {
  empadronamiento: [
    'firstName',
    'lastName',
    'secondLastName',
    'nieNumber',
    'passportNumber',
  ],
  'required-documents': [
    'firstName',
    'lastName',
    'secondLastName',
    'nieNumber',
    'passportNumber',
    'gender',
    'dateOfBirth',
    'cityOfBirth',
    'countryOfBirth',
    'nationality',
    'maritalStatus',
    'fatherName',
    'motherName',
    'streetType',
    'address',
    'addressNumber',
    'addressFloor',
    'city',
    'postalCode',
    'province',
    'phoneNumber',
    'email',
  ],
  'pay-fee': [
    'firstName',
    'lastName',
    'secondLastName',
    'nieNumber',
    'streetType',
    'address',
    'addressNumber',
    'addressFloor',
    'addressDoor',
    'city',
    'province',
    'postalCode',
  ],
  'toma-de-huellas': ['nieNumber', 'firstName', 'lastName'],
  'fingerprint-appointment': [],
  'collect-tie': [],
};
