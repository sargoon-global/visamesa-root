export type PhoneValue = {
  countryCode?: string;
  number?: string;
};

const digitsOnly = (value?: string) => (value ?? '').replace(/\D/g, '');

export const normalizePhone = (phone: PhoneValue): PhoneValue => {
  const countryCode = digitsOnly(phone.countryCode);
  let number = digitsOnly(phone.number);

  if (countryCode && number.startsWith(countryCode) && number.length > 9) {
    number = number.slice(countryCode.length);
  }

  return {countryCode, number};
};

export const phoneToString = (phone: PhoneValue): string => {
  const normalized = normalizePhone(phone);

  if (normalized.countryCode && normalized.number) {
    return `+${normalized.countryCode} ${normalized.number}`;
  }
  return normalized.number || '';
};

export const stringToPhone = (phoneStr: string): PhoneValue | null => {
  if (!phoneStr || typeof phoneStr !== 'string') {
    return null;
  }

  const trimmed = phoneStr.trim();
  const match = trimmed.match(/^\+?(\d{1,3})\s+(.+)$/);
  if (match) {
    return normalizePhone({
      countryCode: match[1],
      number: match[2],
    });
  }

  const digits = digitsOnly(trimmed);
  if (digits.startsWith('34') && digits.length === 11) {
    return normalizePhone({
      countryCode: '34',
      number: digits.slice(2),
    });
  }

  return normalizePhone({
    countryCode: '',
    number: phoneStr,
  });
};
