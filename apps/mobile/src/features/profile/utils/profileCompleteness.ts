import {ProfileData} from '@/features/profile/types/ProfileData';

import {parsePersonalInfo} from './parsePersonalInfo';

/**
 * Checks if the profile is complete using the same rules as official form mappers.
 */
export function isProfileComplete(profileData: ProfileData | null): boolean {
  if (!profileData?.personal) {
    return false;
  }

  return parsePersonalInfo(profileData.personal).ok;
}
