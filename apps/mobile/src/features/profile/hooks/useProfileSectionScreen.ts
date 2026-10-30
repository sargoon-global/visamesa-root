import {useCallback, useState} from 'react';
import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {useConsent} from '@/contexts/ConsentContext';
import {useEntitlements} from '@/contexts/EntitlementsContext';
import {useProfileData} from '@/features/profile/context/ProfileDataContext';
import {
  getProfileSection,
  ProfileSectionId,
} from '@/features/profile/data/profileSections';
import {useStepInvalidationPrompt} from '@/features/profile/hooks/useStepInvalidationPrompt';
import {ProfileStackParamList} from '@/navigation/types';
import {consentService} from '@/features/profile/services/consentService';

type ProfileSectionRoute = RouteProp<ProfileStackParamList, 'ProfileSection'>;

type ProfileSectionNavigation = NativeStackNavigationProp<
  ProfileStackParamList,
  'ProfileSection'
>;

const PROFILE_SECTION_TITLE_KEYS = {
  personal: 'personalTitle',
} as const;

type PendingSectionSave = {
  data: Record<string, unknown>;
  invalidateStepIds?: number[];
};

export type UseProfileSectionScreenResult = {
  title: string;
  formId: string;
  initialValues: Record<string, unknown>;
  isSubmitting: boolean;
  isProfileLocked: boolean;
  showConsentDialog: boolean;
  stepInvalidationDialog: {
    visible: boolean;
    steps: {id: number; title: string}[];
    isConfirming: boolean;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onConsentAccept: () => Promise<void>;
  onConsentDecline: () => void;
};

export function useProfileSectionScreen(
  route: ProfileSectionRoute,
  navigation: ProfileSectionNavigation,
): UseProfileSectionScreenResult {
  const sectionId: ProfileSectionId = route.params.sectionId;
  const section = getProfileSection(sectionId);
  const {t} = useTranslation('profile');
  const {refreshConsent} = useConsent();
  const {isPersonalDetailsLocked: isProfileLocked} = useEntitlements();
  const invalidationPrompt = useStepInvalidationPrompt();

  const {
    personalInitialValues,
    isSubmittingPersonal,
    submitPersonal,
  } = useProfileData();

  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [pendingData, setPendingData] = useState<PendingSectionSave | null>(
    null,
  );

  const title = t(PROFILE_SECTION_TITLE_KEYS[route.params.sectionId]);

  const saveSectionData = useCallback(
    async (payload: PendingSectionSave) => {
      if (sectionId !== 'personal') {
        return;
      }

      await submitPersonal(payload.data, {
        invalidateStepIds: payload.invalidateStepIds,
      });
    },
    [sectionId, submitPersonal],
  );

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      if (isProfileLocked) {
        return;
      }

      const decision = await invalidationPrompt.requestConfirmation(data);

      if (decision === 'prompt') {
        return;
      }

      const hasConsent = await consentService.hasAcceptedConsent();

      if (!hasConsent) {
        setPendingData({data});
        setShowConsentDialog(true);
        return;
      }

      await saveSectionData({data});
    },
    [invalidationPrompt, isProfileLocked, saveSectionData],
  );

  const onConsentAccept = useCallback(async () => {
    try {
      await consentService.recordConsent();
      await refreshConsent();
      setShowConsentDialog(false);

      if (pendingData) {
        await saveSectionData(pendingData);
        setPendingData(null);
      }
    } catch (consentError) {
      throw consentError;
    }
  }, [pendingData, refreshConsent, saveSectionData]);

  const onConsentDecline = useCallback(() => {
    setShowConsentDialog(false);
    setPendingData(null);
    navigation.goBack();
  }, [navigation]);

  const onConfirmInvalidation = useCallback(async () => {
    const payload = await invalidationPrompt.confirm();

    if (!payload) {
      return;
    }

    const savePayload: PendingSectionSave = {
      data: payload.data,
      invalidateStepIds: payload.invalidateStepIds,
    };

    const hasConsent = await consentService.hasAcceptedConsent();

    if (!hasConsent) {
      setPendingData(savePayload);
      setShowConsentDialog(true);
      return;
    }

    await saveSectionData(savePayload);
  }, [invalidationPrompt, saveSectionData]);

  return {
    title,
    formId: section.formId,
    initialValues:
      sectionId === 'personal' ? personalInitialValues : {},
    isSubmitting: sectionId === 'personal' ? isSubmittingPersonal : false,
    isProfileLocked,
    showConsentDialog,
    stepInvalidationDialog: {
      visible: invalidationPrompt.isDialogVisible,
      steps: invalidationPrompt.affectedSteps.map(step => ({
        id: step.id,
        title: step.title,
      })),
      isConfirming: invalidationPrompt.isConfirming,
      onConfirm: onConfirmInvalidation,
      onCancel: invalidationPrompt.cancel,
    },
    onSubmit,
    onConsentAccept,
    onConsentDecline,
  };
}
