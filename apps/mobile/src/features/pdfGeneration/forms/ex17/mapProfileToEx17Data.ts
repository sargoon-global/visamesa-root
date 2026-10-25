import type {PersonalInfo} from '@/features/profile/utils/parsePersonalInfo';

function upper(value: string) {
  return value.trim().toUpperCase();
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

function mapGenderToSex(gender: string) {
  switch (gender.toLowerCase()) {
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

function phoneToText(phone: PersonalInfo['phoneNumber']) {
  const countryCode = phone.countryCode ? `+${phone.countryCode.replace(/\D/g, '')}` : '';
  return [countryCode, phone.number.replace(/\D/g, '')].filter(Boolean).join(' ');
}

export function mapProfileToEx17Data(info: PersonalInfo) {
  const nie = parseNie(info.nieNumber);
  const fullName = [
    upper(info.firstName),
    upper(info.lastName),
    upper(info.secondLastName ?? ''),
  ]
    .filter(Boolean)
    .join(' ');
  const phoneNumber = phoneToText(info.phoneNumber);
  const today = todayIsoDate();
  const address = {
    street: upper(`${info.streetType} ${info.address}`),
    number: info.addressNumber,
    floor: info.addressFloor ?? '',
    city: upper(info.city),
    postalCode: info.postalCode,
    province: upper(info.province),
  };

  return {
    applicant: {
      passportNumber: info.passportNumber,
      nie: {
        prefix: nie.prefix,
        number: nie.number,
        checkDigit: nie.checkDigit,
      },
      firstSurname: upper(info.lastName),
      secondSurname: upper(info.secondLastName ?? ''),
      firstName: upper(info.firstName),
      sex: mapGenderToSex(info.gender),
      birthDate: info.dateOfBirth,
      birthPlace: upper(info.cityOfBirth),
      birthCountry: upper(info.countryOfBirth),
      nationality: upper(info.nationality),
      maritalStatus: info.maritalStatus,
      fatherName: upper(info.fatherName),
      motherName: upper(info.motherName),
      address,
      mobilePhone: phoneNumber,
      email: info.email,
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
      documentNumber: info.nieNumber,
      address,
      mobilePhone: phoneNumber,
      email: info.email,
      // Consent to electronic communications and notifications (DEHú).
      dehuConsent: true,
    },
    request: {
      cardholderFullName: fullName,
      documentType: 'initialCard',
    },
    signature: {
      place: upper(info.city),
      date: today,
      signatureTextOrImagePlaceholder: '',
    },
    destination: {
      office: '',
      dir3Code: '',
      province: upper(info.province),
    },
  };
}
