import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {i18n} from '@visamesa/content/i18n';

import {useToast} from '@/components/Toast/ToastProvider';
import {useAuth} from '@/contexts/AuthContext';
import {useProfileData} from '@/features/profile/context/ProfileDataContext';
import {usePricingLink} from '@/hooks/usePricingLink';
import {useProcessReadiness} from '@/hooks/useProcessReadiness';
import {ProfileSectionId} from '@/features/profile/data/profileSections';
import {ProfileStackParamList} from '@/navigation/types';
import type {ProfileCompleteness} from '@/features/profile/selectors/selectProfileCompleteness';

type ProfileScreenNavigation = NativeStackNavigationProp<
  ProfileStackParamList,
  'Profile'
>;

export type {ProfileSectionId} from '@/features/profile/data/profileSections';

export type UseProfileScreenResult = {
  isAuthLoading: boolean;
  userEmail: string | null;
  isStatusLoading: boolean;
  profileError: Error | null;
  profileCompleteness: ProfileCompleteness;
  hasPaid: boolean;
  onSectionPress: (sectionId: ProfileSectionId) => void;
  onSignInPress: () => void;
  onSignOutPress: () => Promise<void>;
  onPaymentPress: () => void;
  showAlreadyPaidDialog: boolean;
  onDismissAlreadyPaidDialog: () => void;
  onSeePaymentStatus: () => void;
};

export function useProfileScreen(
  navigation: ProfileScreenNavigation,
): UseProfileScreenResult {
  const {user, isLoading: isAuthLoading, logout} = useAuth();
  const {
    isProfileComplete,
    missing,
    isLoading: isReadinessLoading,
    refreshReadiness,
  } = useProcessReadiness();
  const {showToast} = useToast();
  const {openPricing, openPricingStatus} = usePricingLink();
  const [showAlreadyPaidDialog, setShowAlreadyPaidDialog] = useState(false);
  const {error: profileError} = useProfileData();

  useFocusEffect(
    useCallback(() => {
      refreshReadiness().catch(() => {});
    }, [refreshReadiness]),
  );

  const profileCompleteness = useMemo<ProfileCompleteness>(
    () => ({
      personalInformation: isProfileComplete,
      legalPrivacy: !missing.includes('legalPrivacy'),
      payment: !missing.includes('payment'),
    }),
    [isProfileComplete, missing],
  );

  const onSectionPress = (sectionId: ProfileSectionId) => {
    navigation.navigate('ProfileSection', {sectionId});
  };

  const onSignInPress = () => {
    navigation.navigate('Login');
  };

  const onSignOutPress = async () => {
    try {
      await logout();
      showToast(i18n.t('signedOut', {ns: 'profile'}));
    } catch {
      showToast(i18n.t('signOutFailed', {ns: 'profile'}));
    }
  };

  const hasPaid = profileCompleteness.payment;

  const onPaymentPress = () => {
    if (hasPaid) {
      setShowAlreadyPaidDialog(true);
      return;
    }

    openPricing().catch(() => {});
  };

  const onDismissAlreadyPaidDialog = () => {
    setShowAlreadyPaidDialog(false);
  };

  const onSeePaymentStatus = () => {
    setShowAlreadyPaidDialog(false);
    openPricingStatus().catch(() => {});
  };

  return {
    isAuthLoading,
    userEmail: user?.email ?? null,
    isStatusLoading: isReadinessLoading,
    profileError,
    profileCompleteness,
    hasPaid,
    onSectionPress,
    onSignInPress,
    onSignOutPress,
    onPaymentPress,
    showAlreadyPaidDialog,
    onDismissAlreadyPaidDialog,
    onSeePaymentStatus,
  };
}
