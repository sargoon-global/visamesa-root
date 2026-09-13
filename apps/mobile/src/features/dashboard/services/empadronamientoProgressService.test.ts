import {
  shouldAutoCompleteEmpadronamientoStep,
  syncEmpadronamientoStepFromProfile,
} from '@/features/dashboard/services/empadronamientoProgressService';
import {resetUserProgress} from '@/features/dashboard/services/progressService';
import {createUserProgress} from '@/test/fixtures/userProgress';
import {ProfileData} from '@/features/profile/types/ProfileData';

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

describe('empadronamientoProgressService', () => {
  beforeEach(async () => {
    await resetUserProgress();
    fetchTieSteps.mockResolvedValue([
      {
        id: 1,
        requirements: [
          {key: 'passport-nie', label: 'Passport', type: 'self_declared', location: 'in_app'},
          {key: 'attend-ayuntamiento', label: 'Attend', type: 'self_declared', location: 'in_person'},
        ],
      },
    ]);
  });
  it('detects valid empadronamiento in profile', () => {
    const profile: ProfileData = {
      personal: {
        hasEmpadronamiento: 'yes',
        empadronamientoIssuedAt: new Date().toISOString(),
      },
    };

    expect(shouldAutoCompleteEmpadronamientoStep(profile)).toBe(true);
  });

  it('auto-completes step 1 when profile has valid empadronamiento', async () => {
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'not_started',
          requirements: {
            'passport-nie': {completed: false},
            'attend-ayuntamiento': {completed: false},
          },
        },
      ],
    });
    const profile: ProfileData = {
      personal: {
        hasEmpadronamiento: 'yes',
        empadronamientoIssuedAt: new Date().toISOString(),
      },
    };

    const synced = await syncEmpadronamientoStepFromProfile(progress, profile);

    expect(synced.steps.find(step => step.stepId === 1)?.status).toBe('completed');
    expect(
      synced.steps.find(step => step.stepId === 1)?.requirements['passport-nie']
        ?.completed,
    ).toBe(true);
  });

  it('preserves user-completed step when profile has no empadronamiento', async () => {
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'completed',
          completedAt: new Date().toISOString(),
          requirements: {
            'passport-nie': {completed: true, source: {type: 'self_declared'}},
            'attend-ayuntamiento': {completed: true, source: {type: 'self_declared'}},
          },
        },
      ],
    });
    const profile: ProfileData = {
      personal: {
        hasEmpadronamiento: 'no',
      },
    };

    const synced = await syncEmpadronamientoStepFromProfile(progress, profile);

    expect(synced.steps.find(step => step.stepId === 1)?.status).toBe('completed');
    expect(
      synced.steps.find(step => step.stepId === 1)?.requirements['passport-nie']
        ?.completed,
    ).toBe(true);
  });
});
