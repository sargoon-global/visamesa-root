import {act} from 'react';

import {useStepInvalidationPrompt} from '@/features/profile/hooks/useStepInvalidationPrompt';
import {assessProfileChangeImpact} from '@/features/dashboard/services/stepInvalidationService';
import {renderHook} from '@/test/renderHook';
import {createTieStep} from '@/test/fixtures/tieSteps';

jest.mock('@/features/profile/context/ProfileDataContext', () => ({
  useProfileData: () => ({
    profileData: {personal: {email: 'old@example.com'}},
  }),
}));

jest.mock('@/features/dashboard/services/stepInvalidationService', () => ({
  assessProfileChangeImpact: jest.fn(),
}));

const mockAssess = assessProfileChangeImpact as jest.Mock;

describe('useStepInvalidationPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns save when no steps are affected', async () => {
    mockAssess.mockResolvedValue({
      changedFields: [],
      affectedSteps: [],
      invalidateStepIds: [],
    });

    const getHookState = renderHook(() => useStepInvalidationPrompt());

    let decision: string | undefined;

    await act(async () => {
      decision = await getHookState().requestConfirmation({email: 'new@example.com'});
    });

    expect(decision).toBe('save');
    expect(getHookState().isDialogVisible).toBe(false);
  });

  it('opens dialog when steps would be invalidated', async () => {
    mockAssess.mockResolvedValue({
      changedFields: ['email'],
      affectedSteps: [createTieStep({id: 2, slug: 'required-documents'})],
      invalidateStepIds: [2],
    });

    const getHookState = renderHook(() => useStepInvalidationPrompt());

    await act(async () => {
      await getHookState().requestConfirmation({email: 'new@example.com'});
    });

    expect(getHookState().isDialogVisible).toBe(true);
    expect(getHookState().affectedSteps).toHaveLength(1);
  });
});
