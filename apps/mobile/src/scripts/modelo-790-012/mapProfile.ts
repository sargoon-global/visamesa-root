import {normalizePhone, stringToPhone} from '@/features/forms/utils/phoneUtils';

import type {Modelo790AutomationProfile} from './config';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Never substitute invented identity or contact details into an official form. */
export function mapProfileToModelo790(
  personal: Record<string, unknown> | null,
): Modelo790AutomationProfile | null {
  if (!personal) {
    return null;
  }

  const documentNumber = text(personal.nieNumber);
  const fullName = [text(personal.firstName), text(personal.lastName), text(personal.secondLastName)]
    .filter(Boolean)
    .join(' ');
  const street = text(personal.address).match(
    /^(Calle|Carrer|Avenida|Avinguda|Avda|Passeig|Paseo|Plaza|Plaça|Ronda|Travessera|Travesía)\s+(.+)$/i,
  );
  const phone = personal.phoneNumber;
  const phoneParts = phone && typeof phone === 'object'
    ? normalizePhone(phone as {countryCode?: string; number?: string})
    : typeof phone === 'string'
      ? stringToPhone(phone)
      : null;
  const countryCode = text(phoneParts?.countryCode).replace(/\D/g, '');
  const phoneNumber = text(phoneParts?.number).replace(/\D/g, '');
  const number = text(personal.addressNumber);
  const city = text(personal.city);
  const province = text(personal.province);
  const postalCode = text(personal.postalCode);

  if (
    !/^[XYZ]\d{7}[A-Z]$/i.test(documentNumber) ||
    !text(personal.firstName) || !text(personal.lastName) ||
    !street || !number || !city || !province ||
    !/^\d{5}$/.test(postalCode) ||
    (countryCode && countryCode !== '34') || !/^\d{9}$/.test(phoneNumber)
  ) {
    return null;
  }

  return {
    documentNumber,
    fullName,
    address: {
      streetType: street[1],
      streetName: street[2],
      number,
      floor: text(personal.addressFloor),
      city,
      province,
      postalCode,
    },
    phoneNumber,
    feeInputId: 'tasa5Input',
    paymentMethod: 'cash',
  };
}
