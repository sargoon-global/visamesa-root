import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  buildInitialProgressFromSteps,
  clearProgressMemoryCache,
  fetchLocalProgressStore,
  fetchUserProgress,
  resetUserProgress,
  subscribeToProgressReset,
  tryHydrateProgressFromServer,
  updateRequirementProgress,
  updateStepStatus,
} from '@/features/dashboard/services/progressService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/features/home/services/tieStepsService', () => ({
  fetchTieSteps: jest.fn(),
}));

jest.mock('@/features/dashboard/services/progressSyncService', () => ({
  hasPendingProgressSync: jest.fn(() => false),
  syncProgressSnapshot: jest.fn(async (store: unknown) => store),
}));

jest.mock('@/features/dashboard/services/progressHydrationService', () => ({
  fetchMergedProgressStore: jest.fn(),
  isDeviceAuthorizedForProgress: jest.fn(),
}));

const {fetchTieSteps} = jest.requireMock(
  '@/features/home/services/tieStepsService',
) as {fetchTieSteps: jest.Mock};

const {fetchMergedProgressStore} = jest.requireMock(
  '@/features/dashboard/services/progressHydrationService',
) as {fetchMergedProgressStore: jest.Mock};

const {hasPendingProgressSync, syncProgressSnapshot} = jest.requireMock(
  '@/features/dashboard/services/progressSyncService',
) as {
  hasPendingProgressSync: jest.Mock;
  syncProgressSnapshot: jest.Mock;
};

const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('progressService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    hasPendingProgressSync.mockReturnValue(false);
    await resetUserProgress();
    fetchTieSteps.mockResolvedValue([
      {
        id: 1,
        requirements: [
          {key: 'passport', label: 'Passport', type: 'self_declared', location: 'in_app'},
          {
            key: 'appointment-confirmation',
            label: 'Appointment confirmation',
            type: 'assisted_booking',
            location: 'in_app',
          },
        ],
      },
    ]);
  });

  it('creates initial progress for all steps', async () => {
    const progress = await fetchUserProgress();

    expect(progress.currentStepId).toBe(1);
    expect(progress.steps).toHaveLength(1);
    expect(progress.steps[0]?.requirements.passport?.completed).toBe(false);
  });

  it('builds fresh progress from step definitions', () => {
    const progress = buildInitialProgressFromSteps([
      {
        id: 1,
        requirements: [
          {key: 'passport', label: 'Passport', type: 'self_declared', location: 'in_app'},
        ],
      },
      {
        id: 2,
        requirements: [],
      },
    ]);

    expect(progress.currentStepId).toBe(1);
    expect(progress.steps).toHaveLength(2);
    expect(progress.steps[0]?.status).toBe('not_started');
    expect(progress.steps[0]?.requirements.passport?.completed).toBe(false);
  });

  it('updates step and requirement progress', async () => {
    let progress = await fetchUserProgress();

    progress = await updateStepStatus(progress, 1, 'in_progress');
    progress = await updateRequirementProgress(progress, 1, 'passport', {
      completed: true,
      source: {type: 'self_declared'},
    });

    expect(progress.steps[0]?.status).toBe('in_progress');
    expect(progress.steps[0]?.requirements.passport?.completed).toBe(true);
  });

  it('notifies dev subscribers when progress is reset', async () => {
    const listener = jest.fn();

    subscribeToProgressReset(listener);
    await resetUserProgress();

    expect(listener).toHaveBeenCalled();
  });

  it('clears in-memory progress without deleting stored progress', async () => {
    const progress = await fetchUserProgress();

    clearProgressMemoryCache();
    const reloaded = await fetchUserProgress();

    expect(reloaded.currentStepId).toBe(progress.currentStepId);
  });

  it('sets clientUpdatedAt when progress is edited', async () => {
    let progress = await fetchUserProgress();

    progress = await updateStepStatus(progress, 1, 'in_progress');
    const store = await fetchLocalProgressStore();

    expect(store.clientUpdatedAt).toEqual(expect.any(String));
  });

  it('stores null clientUpdatedAt for pristine initial progress', async () => {
    await fetchUserProgress();
    const store = await fetchLocalProgressStore();

    expect(store.clientUpdatedAt).toBeNull();
    expect(store.lastSyncedClientUpdatedAt).toBeNull();
  });

  it('hydrates from server when device is authorized', async () => {
    fetchMergedProgressStore.mockResolvedValue({
      progress: {
        currentStepId: 2,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {
              passport: {completed: true, source: {type: 'self_declared'}},
            },
          },
        ],
      },
      clientUpdatedAt: '2026-09-13T12:00:00.000Z',
      lastSyncedClientUpdatedAt: '2026-09-13T12:00:00.000Z',
    });

    const hydrated = await tryHydrateProgressFromServer();

    expect(hydrated).toBe(true);
    const progress = await fetchUserProgress();
    expect(progress.currentStepId).toBe(2);
    expect(progress.steps[0]?.status).toBe('completed');
  });

  it('returns false when hydration is skipped', async () => {
    fetchMergedProgressStore.mockResolvedValue(null);

    await expect(tryHydrateProgressFromServer()).resolves.toBe(false);
  });

  it('persists progress store shape in AsyncStorage', async () => {
    await fetchUserProgress();

    expect(asyncStorage.setItem).toHaveBeenCalledWith(
      '@visamesa_user_progress',
      expect.stringContaining('"clientUpdatedAt"'),
    );
  });
});
