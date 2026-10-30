import type {PersonalInfo} from '@/features/profile/utils/parsePersonalInfo';
import {personalRecordForValidation} from '@/features/profile/utils/parsePersonalInfo';

function normalizeValue(field: keyof PersonalInfo, value: unknown): string {
  if (field === 'phoneNumber' && value && typeof value === 'object') {
    const phone = value as {countryCode?: string; number?: string};
    return `${phone.countryCode ?? ''}|${phone.number ?? ''}`;
  }

  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

export function getChangedPersonalFields(
  previous: Record<string, unknown> | null,
  next: Record<string, unknown>,
): (keyof PersonalInfo)[] {
  const prevRecord = personalRecordForValidation(previous ?? {});
  const nextRecord = personalRecordForValidation(next);
  const keys = new Set([
    ...Object.keys(prevRecord),
    ...Object.keys(nextRecord),
  ]) as Set<keyof PersonalInfo>;

  const changed: (keyof PersonalInfo)[] = [];

  for (const key of keys) {
    if (normalizeValue(key, prevRecord[key]) !== normalizeValue(key, nextRecord[key])) {
      changed.push(key);
    }
  }

  return changed;
}
