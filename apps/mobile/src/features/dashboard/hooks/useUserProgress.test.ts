import {act} from 'react';

import {renderHookAsync, unmountRenderedHook} from '@/test/renderHook';
import {createUserProgress} from '@/test/fixtures/userProgress';

import {useUserProgress} from './useUserProgress';

const mockSubscribeToProgressStoreChange = jest.fn((_listener: () => void) => () => {});

jest.mock('@/features/dashboard/services/progressService', () => ({
  fetchUserProgress: jest.fn(),
  saveUserProgress: jest.fn(),
  setCurrentStepId: jest.fn(),
  updateRequirementProgress: jest.fn(),
  updateStepStatus: jest.fn(),
  subscribeToProgressReset: jest.fn(() => () => {}),
  subscribeToProgressStoreChange: (listener: () => void) =>
    mockSubscribeToProgressStoreChange(listener),
}));

type UserProgressAuthMockValue = {
  user: {id: string; email: string} | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const mockUseAuth = jest.fn((): UserProgressAuthMockValue => ({
  user: {id: 'user-1', email: 'test@example.com'},
  isAuthenticated: true,
  isLoading: false,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const progressService = jest.requireMock(
  '@/features/dashboard/services/progressService',
) as {
  fetchUserProgress: jest.Mock;
  saveUserProgress: jest.Mock;
  setCurrentStepId: jest.Mock;
  updateRequirementProgress: jest.Mock;
  updateStepStatus: jest.Mock;
};

async function mountUserProgress() {
  return renderHookAsync(useUserProgress, state => !state.isLoading);
}

describe('useUserProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {id: 'user-1', email: 'test@example.com'},
      isAuthenticated: true,
      isLoading: false,
    });
    progressService.fetchUserProgress.mockResolvedValue(createUserProgress());
  });

  afterEach(() => {
    unmountRenderedHook();
  });

  it('subscribes to progress store changes', async () => {
    await mountUserProgress();

    expect(mockSubscribeToProgressStoreChange).toHaveBeenCalled();
  });

  it('loads progress on mount', async () => {
    const mockProgress = createUserProgress({
      currentStepId: 1,
      steps: [
        {
          stepId: 1,
          status: 'not_started',
          requirements: {},
        },
      ],
    });

    progressService.fetchUserProgress.mockResolvedValue(mockProgress);

    const getHookState = await mountUserProgress();

    expect(progressService.fetchUserProgress).toHaveBeenCalled();
    expect(getHookState().progress).toEqual(mockProgress);
    expect(getHookState().isLoading).toBe(false);
  });

  it('does not load progress when logged out', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    const getHookState = await mountUserProgress();

    expect(progressService.fetchUserProgress).not.toHaveBeenCalled();
    expect(getHookState().progress).toBeNull();
    expect(getHookState().isLoading).toBe(false);
  });

  it('handles fetch error gracefully', async () => {
    const error = new Error('Fetch failed');
    progressService.fetchUserProgress.mockRejectedValue(error);

    const getHookState = await mountUserProgress();

    expect(getHookState().error).toEqual(error);
    expect(getHookState().isLoading).toBe(false);
  });

  it('refreshes progress when requested', async () => {
    const initialProgress = createUserProgress({currentStepId: 1});
    const updatedProgress = createUserProgress({currentStepId: 2});

    progressService.fetchUserProgress
      .mockResolvedValueOnce(initialProgress)
      .mockResolvedValueOnce(updatedProgress);

    const getHookState = await mountUserProgress();

    expect(getHookState().progress?.currentStepId).toBe(1);

    await act(async () => {
      await getHookState().refreshProgress();
    });

    expect(getHookState().progress?.currentStepId).toBe(2);
    expect(progressService.fetchUserProgress).toHaveBeenCalledTimes(2);
  });

  it('starts a step by updating status', async () => {
    const mockProgress = createUserProgress({currentStepId: 1});
    progressService.fetchUserProgress.mockResolvedValue(mockProgress);
    progressService.updateStepStatus.mockResolvedValue(mockProgress);

    const getHookState = await mountUserProgress();

    await act(async () => {
      await getHookState().startStep(1);
    });

    expect(progressService.updateStepStatus).toHaveBeenCalledWith(
      mockProgress,
      1,
      'in_progress',
    );
  });

  it('completes a step and advances to next', async () => {
    const mockProgress = createUserProgress({currentStepId: 1});
    progressService.fetchUserProgress.mockResolvedValue(mockProgress);
    progressService.updateStepStatus.mockResolvedValue(mockProgress);
    progressService.setCurrentStepId.mockResolvedValue(mockProgress);

    const getHookState = await mountUserProgress();

    await act(async () => {
      await getHookState().completeStep(1, 2);
    });

    expect(progressService.updateStepStatus).toHaveBeenCalledWith(
      mockProgress,
      1,
      'completed',
    );
    expect(progressService.setCurrentStepId).toHaveBeenCalledWith(
      mockProgress,
      2,
    );
  });

  it('toggles self-declared requirement', async () => {
    const mockProgress = createUserProgress({currentStepId: 1});
    progressService.fetchUserProgress.mockResolvedValue(mockProgress);
    progressService.updateRequirementProgress.mockResolvedValue(mockProgress);

    const getHookState = await mountUserProgress();

    await act(async () => {
      await getHookState().toggleSelfDeclaredRequirement(
        1,
        'Passport',
        true,
      );
    });

    expect(progressService.updateRequirementProgress).toHaveBeenCalledWith(
      mockProgress,
      1,
      'Passport',
      {completed: true, source: {type: 'self_declared'}},
    );
  });

  it('completes booking assistant requirement with appointment data', async () => {
    const mockProgress = createUserProgress({currentStepId: 1});
    progressService.fetchUserProgress.mockResolvedValue(mockProgress);
    progressService.updateRequirementProgress.mockResolvedValue(mockProgress);

    const getHookState = await mountUserProgress();

    const appointment = {
      office: 'Barcelona Office',
      date: '2026-07-01',
      time: '10:00',
      location: 'Barcelona Office',
      confirmationCode: 'ABC123',
    };

    await act(async () => {
      await getHookState().completeBookingAssistantRequirement(
        1,
        'Book Appointment',
        'cita-previa',
        appointment,
      );
    });

    expect(progressService.updateRequirementProgress).toHaveBeenCalledWith(
      mockProgress,
      1,
      'Book Appointment',
      expect.objectContaining({
        completed: true,
        source: expect.objectContaining({
          type: 'assisted_booking',
          bookingAssistantId: 'cita-previa',
          appointment,
        }),
      }),
    );
  });

  it('clears booking assistant requirement', async () => {
    const mockProgress = createUserProgress({currentStepId: 1});
    progressService.fetchUserProgress.mockResolvedValue(mockProgress);
    progressService.updateRequirementProgress.mockResolvedValue(mockProgress);

    const getHookState = await mountUserProgress();

    await act(async () => {
      await getHookState().clearBookingAssistantRequirement(
        1,
        'Book Appointment',
      );
    });

    expect(progressService.updateRequirementProgress).toHaveBeenCalledWith(
      mockProgress,
      1,
      'Book Appointment',
      {completed: false},
    );
  });

  it('completes form requirement', async () => {
    const mockProgress = createUserProgress({currentStepId: 1});
    progressService.fetchUserProgress.mockResolvedValue(mockProgress);
    progressService.updateRequirementProgress.mockResolvedValue(mockProgress);

    const getHookState = await mountUserProgress();

    await act(async () => {
      await getHookState().completeFormRequirement(
        1,
        'Application Form',
        'test-form-id',
      );
    });

    expect(progressService.updateRequirementProgress).toHaveBeenCalledWith(
      mockProgress,
      1,
      'Application Form',
      expect.objectContaining({
        completed: true,
        source: expect.objectContaining({
          type: 'form',
        }),
      }),
    );
  });
});
