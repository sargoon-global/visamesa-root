import { API_ENDPOINTS } from '@/config/api';
import apiClient from '@/services/api';
import { cryptoService } from '@/services/cryptoService';
import {
  ProfileDecryptionError,
  isProfileDecryptionFailure,
} from '@/services/profileCryptoErrors';
import {
  reportClientError,
  reportClientErrorFromException,
} from '@/services/clientErrorService';
import { EncryptedPayload } from '@/types/encrypted';

import {
  mapPersonalToCitaPreviaBookingAssistantProfile,
  mapPersonalToEmpadronamientoBookingAssistantProfile,
  type BookingAssistantInjectionProfiles,
} from '@/scripts/bookingAssistantProfile';

import {parsePersonalInfo} from '../utils/parsePersonalInfo';
import {migratePersonalFields} from '../utils/migratePersonalFields';

import { ProfileData, ProfileSection } from '../types/ProfileData';

export const EMPTY_PROFILE: ProfileData = {
  personal: null,
};

/**
 * Migrates legacy profile data from the old three-section format to the new single-section format.
 * Maps residenceRegistration fields into personal section where they don't conflict.
 */
function migrateLegacyProfile(data: unknown): ProfileData {
  if (!data || typeof data !== 'object') {
    return EMPTY_PROFILE;
  }

  const legacy = data as Record<string, unknown>;

  // Start with the personal section
  let personal = legacy.personal as Record<string, unknown> | null;

  // If we have legacy residenceRegistration data, merge relevant fields
  if (legacy.residenceRegistration && typeof legacy.residenceRegistration === 'object') {
    const residence = legacy.residenceRegistration as Record<string, unknown>;
    const merged = {...(personal || {})};

    // Only merge if personal doesn't already have these fields (don't overwrite)
    if (residence.address && !merged.address) {
      merged.address = residence.address;
    }
    if (residence.city && !merged.city) {
      merged.city = residence.city;
    }
    if (residence.postalCode && !merged.postalCode) {
      merged.postalCode = residence.postalCode;
    }
    if (residence.dateOfDocumentIssuance && !merged.empadronamientoIssuedAt) {
      merged.empadronamientoIssuedAt = residence.dateOfDocumentIssuance;
      merged.hasEmpadronamiento = 'yes';
    }

    personal = Object.keys(merged).length > 0 ? merged : null;
  }

  if (personal?.dateOfDocumentIssuance && !personal.empadronamientoIssuedAt) {
    personal = {
      ...personal,
      empadronamientoIssuedAt: personal.dateOfDocumentIssuance,
      hasEmpadronamiento: personal.hasEmpadronamiento ?? 'yes',
    };
  }

  if (personal) {
    personal = migratePersonalFields(personal);
  }

  return {personal};
}

async function fetchEncryptedPayload(): Promise<EncryptedPayload | null> {
  try {
    const response = await apiClient.get<EncryptedPayload | null>(
      API_ENDPOINTS.encryptedDetails,
    );

    return response.data;
  } catch (error) {
    reportClientErrorFromException('PROFILE_FETCH_FAILED', error);
    throw error;
  }
}

async function decryptProfilePayload(
  payload: EncryptedPayload,
): Promise<ProfileData> {
  try {
    const decrypted = await cryptoService.decrypt<unknown>(payload);
    return migrateLegacyProfile(decrypted);
  } catch (error) {
    if (isProfileDecryptionFailure(error)) {
      reportClientError('PROFILE_DECRYPTION_FAILED');
      throw new ProfileDecryptionError();
    }

    throw error;
  }
}

export async function getProfile(): Promise<ProfileData> {
  const payload = await fetchEncryptedPayload();

  if (!payload) {
    return EMPTY_PROFILE;
  }

  return decryptProfilePayload(payload);
}

/**
 * Loads only the personal section for WebView booking assistants.
 * Returns null when unavailable or encrypted on another device (no throw).
 */
export async function getPersonalForBookingAssistant(): Promise<
  Record<string, unknown> | null
> {
  const payload = await fetchEncryptedPayload();

  if (!payload) {
    return null;
  }

  try {
    const profile = await decryptProfilePayload(payload);
    return profile.personal;
  } catch (error) {
    if (isProfileDecryptionFailure(error)) {
      return null;
    }

    throw error;
  }
}

export async function updateProfile(
  section: ProfileSection,
  data: Record<string, unknown>,
): Promise<ProfileData> {
  const payload = await fetchEncryptedPayload();
  let current = EMPTY_PROFILE;

  if (payload) {
    try {
      current = await decryptProfilePayload(payload);
    } catch (error) {
      if (!isProfileDecryptionFailure(error)) {
        throw error;
      }
    }
  }

  let sectionData = data;
  if (section === 'personal') {
    sectionData = migratePersonalFields(data);
  }

  const updated: ProfileData = {...current, [section]: sectionData};
  const encrypted = await cryptoService.encrypt(updated);

  try {
    await apiClient.put(API_ENDPOINTS.encryptedDetails, encrypted);
  } catch (error) {
    reportClientErrorFromException('PROFILE_ENCRYPTED_SYNC_FAILED', error, {
      section,
    });
    throw error;
  }

  return updated;
}

export async function loadBookingAssistantInjectionProfiles(
  fallbackEmail?: string | null,
): Promise<BookingAssistantInjectionProfiles | null> {
  const personal = await getPersonalForBookingAssistant();

  if (!personal) {
    return null;
  }

  const parsed = parsePersonalInfo(personal);

  return {
    personal,
    empadronamiento: parsed.ok
      ? mapPersonalToEmpadronamientoBookingAssistantProfile(
          parsed.data,
          fallbackEmail,
        )
      : null,
    citaPrevia: parsed.ok
      ? mapPersonalToCitaPreviaBookingAssistantProfile(parsed.data)
      : null,
  };
}
