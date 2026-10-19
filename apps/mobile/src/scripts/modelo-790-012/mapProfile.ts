import {
  MODELO790_FEE_INPUT_ID,
  MODELO790_PAYMENT_METHOD,
} from '@/features/pdfGeneration/forms/modelo790/modelo790Constants';
import type {PersonalInfo} from '@/features/profile/utils/parsePersonalInfo';

import type {Modelo790AutomationProfile} from './config';

function formatPhoneForModelo790(phone: PersonalInfo['phoneNumber']): string {
  const countryCode = phone.countryCode.replace(/\D/g, '');
  const number = phone.number.replace(/\D/g, '');
  const formatted = countryCode ? `+${countryCode} ${number}` : number;
  return formatted.slice(0, 15);
}

/** Maps validated personal info into the official Modelo 790 form shape. */
export function toModelo790(info: PersonalInfo): Modelo790AutomationProfile {
  const fullName = [info.firstName, info.lastName, info.secondLastName]
    .filter(Boolean)
    .join(' ');

  return {
    documentNumber: info.nieNumber,
    fullName,
    address: {
      streetType: info.streetType,
      streetName: info.address,
      number: info.addressNumber,
      floor: info.addressFloor ?? '',
      door: info.addressDoor ?? '',
      city: info.city,
      province: info.province,
      postalCode: info.postalCode,
    },
    phoneNumber: formatPhoneForModelo790(info.phoneNumber),
    feeInputId: MODELO790_FEE_INPUT_ID,
    paymentMethod: MODELO790_PAYMENT_METHOD,
  };
}
