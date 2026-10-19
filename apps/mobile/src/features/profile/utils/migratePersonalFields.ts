import {normalizePhone, stringToPhone} from '@/features/forms/utils/phoneUtils';
import {VISA_MESA_SUPPORTED_PROVINCE} from '@/features/profile/data/barcelonaScope';
import {splitLegacyAddress} from '@/features/profile/data/streetTypes';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function migratePersonalFields(
  personal: Record<string, unknown>,
): Record<string, unknown> {
  const next = {...personal};

  if (!text(next.streetType) && text(next.address)) {
    const split = splitLegacyAddress(text(next.address));
    if (split.streetType) {
      next.streetType = split.streetType;
      next.address = split.streetName;
    }
  }

  next.province = VISA_MESA_SUPPORTED_PROVINCE;

  const combinedFloor = text(next.addressFloor);
  if (combinedFloor && !text(next.addressDoor)) {
    const floorDoorMatch = combinedFloor.match(/^(\d+)\s*[.\-/]\s*(\d+)$/);
    if (floorDoorMatch) {
      next.addressFloor = floorDoorMatch[1];
      next.addressDoor = floorDoorMatch[2];
    }
  }

  const phone = next.phoneNumber;
  if (typeof phone === 'string') {
    const parsed = stringToPhone(phone);
    if (parsed) {
      next.phoneNumber = normalizePhone(parsed);
    }
  } else if (phone && typeof phone === 'object') {
    next.phoneNumber = normalizePhone(
      phone as {countryCode?: string; number?: string},
    );
  }

  return next;
}
