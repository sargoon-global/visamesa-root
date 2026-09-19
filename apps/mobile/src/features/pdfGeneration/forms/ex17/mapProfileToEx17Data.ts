import type {ProfileData} from '@/features/profile/types/ProfileData';

type PhoneValue = string | {countryCode?: string; number?: string};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function upper(value: unknown) {
  return text(value).toUpperCase();
}

function phoneToText(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const phone = value as PhoneValue;
    if (typeof phone === 'object') {
      return [phone.countryCode, phone.number].filter(Boolean).join(' ');
    }
  }

  return '';
}

function parseNie(nieNumber: string) {
  const normalized = nieNumber.replace(/\s+/g, '').toUpperCase();
  const match = normalized.match(/^([XYZ])(\d+)([A-Z])$/);

  if (!match) {
    return {prefix: '', number: '', checkDigit: ''};
  }

  return {
    prefix: match[1],
    number: match[2],
    checkDigit: match[3],
  };
}

function mapGenderToSex(gender: unknown) {
  switch (text(gender).toLowerCase()) {
    case 'male':
      return 'H';
    case 'female':
      return 'M';
    case 'other':
      return 'X';
    default:
      return '';
  }
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function mapProfileToEx17Data(profileData: ProfileData) {
  const personal = profileData.personal ?? {};
  const nieNumber = text(personal.nieNumber);
  const passportNumber = text(personal.passportNumber);
  const nie = parseNie(nieNumber);
  const fullName = [
    upper(personal.firstName),
    upper(personal.lastName),
    upper(personal.secondLastName),
  ]
    .filter(Boolean)
    .join(' ');
  const phoneNumber = phoneToText(personal.phoneNumber);
  const email = text(personal.email);
  const today = todayIsoDate();
  const address = {
    street: upper(personal.address),
    number: text(personal.addressNumber),
    floor: text(personal.addressFloor),
    city: upper(personal.city),
    postalCode: text(personal.postalCode),
    province: upper(personal.province),
  };

  return {
    applicant: {
      passportNumber,
      nie: {
        prefix: nie.prefix,
        number: nie.number,
        checkDigit: nie.checkDigit,
      },
      firstSurname: upper(personal.lastName),
      secondSurname: upper(personal.secondLastName),
      firstName: upper(personal.firstName),
      sex: mapGenderToSex(personal.gender),
      birthDate: text(personal.dateOfBirth),
      birthPlace: upper(personal.cityOfBirth),
      birthCountry: upper(personal.countryOfBirth),
      nationality: upper(personal.nationality),
      maritalStatus: text(personal.maritalStatus),
      fatherName: upper(personal.fatherName),
      motherName: upper(personal.motherName),
      address,
      mobilePhone: phoneNumber,
      email,
      legalRepresentative: {
        fullName: '',
        documentNumber: '',
        relationshipTitle: '',
      },
    },
    presenter: {
      fullNameOrBusinessName: '',
      documentNumber: '',
      address: {
        street: '',
        number: '',
        floor: '',
        city: '',
        postalCode: '',
        province: '',
      },
      mobilePhone: '',
      email: '',
      legalRepresentative: {
        fullName: '',
        documentNumber: '',
        relationshipTitle: '',
      },
    },
    notifications: {
      fullNameOrBusinessName: fullName,
      documentNumber: nieNumber,
      address,
      mobilePhone: phoneNumber,
      email,
      dehuConsent: false,
    },
    request: {
      cardholderFullName: fullName,
      documentType: 'initialCard',
    },
    signature: {
      place: upper(personal.city),
      date: today,
      signatureTextOrImagePlaceholder: '',
    },
    destination: {
      office: '',
      dir3Code: '',
      province: upper(personal.province),
    },
  };
}
