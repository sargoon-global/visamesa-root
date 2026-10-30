import {useCallback, useMemo} from 'react';

import {useConsent} from '@/contexts/ConsentContext';
import {useEntitlements} from '@/contexts/EntitlementsContext';
import {useProfileCompletion} from '@/hooks/useProfileCompletion';
import {
  PROCESS_READINESS_ITEM_ORDER,
  type ProcessReadinessMissing,
} from '@/types/processReadiness';

export type {ProcessReadinessMissing} from '@/types/processReadiness';
export {PROCESS_READINESS_ITEM_ORDER} from '@/types/processReadiness';

export type UseProcessReadinessResult = {
  canStartProcess: boolean;
  isProfileComplete: boolean;
  missing: ProcessReadinessMissing[];
  isLoading: boolean;
  refreshReadiness: () => Promise<void>;
  /** Refreshes payment + legal badges without reloading encrypted profile. */
  refreshReadinessForProfileDisplay: () => Promise<void>;
};

/**
 * Checks if the user is ready to start the TIE process.
 * Requires personal information, payment, and legal consent.
 * This is the single source of truth for gating step 1.
 */
export function useProcessReadiness(): UseProcessReadinessResult {
  const {
    hasPaidService,
    isLoading: isLoadingEntitlements,
    refreshEntitlements,
  } = useEntitlements();
  const {isProfileComplete, isLoading: isLoadingProfile, refreshCompletion} =
    useProfileCompletion();
  const {hasConsent, isLoading: isLoadingConsent, refreshConsent} =
    useConsent();

  const refreshReadiness = useCallback(async () => {
    await Promise.all([
      refreshCompletion(),
      refreshConsent(),
      refreshEntitlements(),
    ]);
  }, [refreshCompletion, refreshConsent, refreshEntitlements]);

  const refreshReadinessForProfileDisplay = useCallback(async () => {
    await Promise.all([refreshConsent(), refreshEntitlements()]);
  }, [refreshConsent, refreshEntitlements]);

  const isLoading =
    isLoadingEntitlements || isLoadingProfile || isLoadingConsent;

  return useMemo<UseProcessReadinessResult>(() => {
    const missingByItem: Record<ProcessReadinessMissing, boolean> = {
      personalInformation: !isProfileComplete,
      legalPrivacy: !hasConsent,
      payment: !hasPaidService(),
    };

    const missing = PROCESS_READINESS_ITEM_ORDER.filter(
      item => missingByItem[item],
    );

    return {
      canStartProcess: missing.length === 0,
      isProfileComplete,
      missing,
      isLoading,
      refreshReadiness,
      refreshReadinessForProfileDisplay,
    };
  }, [
    hasPaidService,
    isProfileComplete,
    hasConsent,
    isLoading,
    refreshReadiness,
    refreshReadinessForProfileDisplay,
  ]);
}
