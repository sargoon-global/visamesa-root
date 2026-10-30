import {useCallback, useState} from 'react';

import {useProfileData} from '@/features/profile/context/ProfileDataContext';
import {assessProfileChangeImpact} from '@/features/dashboard/services/stepInvalidationService';
import type {TieStepDetail} from '@/features/home/types/TieStepDetail';

type PendingSave = {
  data: Record<string, unknown>;
  invalidateStepIds: number[];
};

export function useStepInvalidationPrompt() {
  const {profileData} = useProfileData();
  const [affectedSteps, setAffectedSteps] = useState<TieStepDetail[]>([]);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const requestConfirmation = useCallback(
    async (data: Record<string, unknown>): Promise<'save' | 'prompt' | 'noop'> => {
      const impact = await assessProfileChangeImpact(
        profileData?.personal ?? null,
        data,
      );

      if (impact.invalidateStepIds.length === 0) {
        return 'save';
      }

      setAffectedSteps(impact.affectedSteps);
      setPendingSave({
        data,
        invalidateStepIds: impact.invalidateStepIds,
      });
      return 'prompt';
    },
    [profileData?.personal],
  );

  const cancel = useCallback(() => {
    setAffectedSteps([]);
    setPendingSave(null);
  }, []);

  const confirm = useCallback(async (): Promise<PendingSave | null> => {
    if (!pendingSave) {
      return null;
    }

    setIsConfirming(true);

    try {
      const payload = pendingSave;
      setAffectedSteps([]);
      setPendingSave(null);
      return payload;
    } finally {
      setIsConfirming(false);
    }
  }, [pendingSave]);

  return {
    affectedSteps,
    isDialogVisible: affectedSteps.length > 0 && pendingSave !== null,
    isConfirming,
    requestConfirmation,
    cancel,
    confirm,
  };
}
