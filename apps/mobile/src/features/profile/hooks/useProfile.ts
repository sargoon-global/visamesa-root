import {useCallback, useEffect, useMemo, useState} from 'react';
import {i18n} from '@visamesa/content/i18n';

import {useToast} from '@/components/Toast/ToastProvider';
import {syncEmpadronamientoStepFromProfile} from '@/features/dashboard/services/empadronamientoProgressService';
import {reconcileStepStatuses} from '@/features/dashboard/services/progressReconciliationService';
import {isUserProgressEqual} from '@/features/dashboard/utils/userProgressEquality';
import {
  fetchUserProgress,
  saveUserProgress,
  tryHydrateProgressFromServer,
} from '@/features/dashboard/services/progressService';
import {fetchTieSteps} from '@/features/home/services/tieStepsService';
import {phoneToString, stringToPhone} from '@/features/forms/utils/phoneUtils';
import {
  EMPTY_PROFILE,
  getProfile,
  updateProfile,
} from '@/features/profile/services/profileService';
import {
  ProfileData,
  ProfileSection,
} from '@/features/profile/types/ProfileData';
import {isProfileComplete} from '@/features/profile/utils/profileCompleteness';
import {ProfileDecryptionError} from '@/services/profileCryptoErrors';

type SubmittingState = Record<ProfileSection, boolean>;

const INITIAL_SUBMITTING: SubmittingState = {
  personal: false,
};

export type UseProfileResult = {
  profileData: ProfileData | null;
  isLoading: boolean;
  error: Error | null;
  isProfileComplete: boolean;
  personalInitialValues: Record<string, unknown>;
  isSubmittingPersonal: boolean;
  submitPersonal: (data: Record<string, unknown>) => Promise<void>;
  refreshProfile: () => Promise<boolean>;
};

export function useProfile(
  isEnabled: boolean,
  authEmail?: string | null,
): UseProfileResult {
  const {showToast} = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] =
    useState<SubmittingState>(INITIAL_SUBMITTING);

  const refreshProfile = useCallback(async (): Promise<boolean> => {
    if (!isEnabled) {
      setProfileData(null);
      setIsLoading(false);
      setError(null);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getProfile();
      setProfileData(data);

      try {
        await tryHydrateProgressFromServer();
      } catch {
        // Progress hydration is best-effort after profile load
      }

      return isProfileComplete(data);
    } catch (err) {
      if (err instanceof ProfileDecryptionError) {
        setProfileData(EMPTY_PROFILE);
        setError(err);
      } else {
        setError(
          err instanceof Error
            ? err
            : new Error(i18n.t('loadFailed', {ns: 'profile'})),
        );
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      setProfileData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    refreshProfile().catch(() => {});
  }, [isEnabled, refreshProfile]);

  const personalInitialValues = useMemo(() => {
    const values = {...(profileData?.personal ?? {})};

    if (values.phoneNumber && typeof values.phoneNumber === 'string') {
      const phoneObj = stringToPhone(values.phoneNumber as string);
      if (phoneObj) {
        values.phoneNumber = phoneObj;
      }
    }

    const storedEmail =
      typeof values.email === 'string' ? values.email.trim() : '';
    if (!storedEmail && authEmail) {
      values.email = authEmail;
    }

    return values;
  }, [authEmail, profileData?.personal]);

  const profileForCompleteness = useMemo(() => {
    if (!profileData?.personal && !authEmail) {
      return profileData;
    }

    const personal = {...(profileData?.personal ?? {})};
    const storedEmail =
      typeof personal.email === 'string' ? personal.email.trim() : '';

    if (!storedEmail && authEmail) {
      personal.email = authEmail;
    }

    return {personal};
  }, [authEmail, profileData]);

  const isPersonalInfoComplete = useMemo(
    () => isProfileComplete(profileForCompleteness),
    [profileForCompleteness],
  );

  const submitSection = async (
    section: ProfileSection,
    data: Record<string, unknown>,
    successMessage: string,
  ) => {
    setSubmitting(current => ({...current, [section]: true}));

    try {
      const payload = {...data};

      if (
        section === 'personal' &&
        payload.phoneNumber &&
        typeof payload.phoneNumber === 'object'
      ) {
        payload.phoneNumber = phoneToString(
          payload.phoneNumber as {
            countryCode?: string;
            number?: string;
          },
        );
      }

      const result = await updateProfile(section, payload);
      setProfileData(result);

      const complete = isProfileComplete(result);

      if (section === 'personal') {
        try {
          await tryHydrateProgressFromServer();
          const progress = await fetchUserProgress();
          const tieSteps = await fetchTieSteps();
          let synced = await syncEmpadronamientoStepFromProfile(progress, result);
          synced = reconcileStepStatuses(synced, tieSteps, {
            isProfileComplete: complete,
            allSteps: tieSteps,
          });

          if (!isUserProgressEqual(synced, progress)) {
            await saveUserProgress(synced);
          }
        } catch {
          // Progress sync is best-effort after profile save
        }
      }

      showToast(successMessage);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : i18n.t('saveFailed', {ns: 'profile'});
      showToast(message);
      throw err;
    } finally {
      setSubmitting(current => ({...current, [section]: false}));
    }
  };

  return {
    profileData,
    isLoading,
    error,
    isProfileComplete: isPersonalInfoComplete,
    personalInitialValues,
    isSubmittingPersonal: submitting.personal,
    submitPersonal: data =>
      submitSection(
        'personal',
        data,
        i18n.t('personalSaved', {ns: 'profile'}),
      ),
    refreshProfile,
  };
}
