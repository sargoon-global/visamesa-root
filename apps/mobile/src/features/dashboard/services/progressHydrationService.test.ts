import type {RemoteProgressSnapshot} from '@/features/dashboard/types/ProgressStore';
import {ProfileDecryptionError} from '@/services/profileCryptoErrors';
import {createUserProgress} from '@/test/fixtures/userProgress';

import {
  fetchMergedProgressStore,
  isDeviceAuthorizedForProgress,
  mergeLocalAndRemoteProgress,
} from './progressHydrationService';

jest.mock('@/features/profile/services/profileService', () => ({
  getProfile: jest.fn(),
}));

jest.mock('@/features/dashboard/services/progressSyncService', () => ({
  fetchRemoteProgressSnapshot: jest.fn(),
  remoteSnapshotToStore: jest.fn((snapshot: {
    currentStepId: number;
    steps: unknown[];
    clientUpdatedAt: string;
  }) => ({
    progress: {
      currentStepId: snapshot.currentStepId,
      steps: snapshot.steps,
    },
    clientUpdatedAt: snapshot.clientUpdatedAt,
    lastSyncedClientUpdatedAt: snapshot.clientUpdatedAt,
  })),
}));

const {getProfile} = jest.requireMock(
  '@/features/profile/services/profileService',
) as {getProfile: jest.Mock};

const {fetchRemoteProgressSnapshot} = jest.requireMock(
  '@/features/dashboard/services/progressSyncService',
) as {fetchRemoteProgressSnapshot: jest.Mock};

describe('progressHydrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isDeviceAuthorizedForProgress', () => {
    it('returns true when profile decrypts', async () => {
      getProfile.mockResolvedValue({personal: {firstName: 'Jane'}});

      await expect(isDeviceAuthorizedForProgress()).resolves.toBe(true);
    });

    it('returns false on other-device decryption error', async () => {
      getProfile.mockRejectedValue(new ProfileDecryptionError());

      await expect(isDeviceAuthorizedForProgress()).resolves.toBe(false);
    });
  });

  describe('mergeLocalAndRemoteProgress', () => {
    const remote: RemoteProgressSnapshot = {
      currentStepId: 2,
      steps: [
        {
          stepId: 1,
          status: 'completed',
          requirements: {},
        },
      ],
      clientUpdatedAt: '2026-09-13T12:00:00.000Z',
    };

    it('returns remote store when local is pristine', () => {
      const local = {
        progress: createUserProgress(),
        clientUpdatedAt: null,
        lastSyncedClientUpdatedAt: null,
      };

      const merged = mergeLocalAndRemoteProgress(local, remote);

      expect(merged?.progress.currentStepId).toBe(2);
      expect(merged?.clientUpdatedAt).toBe(remote.clientUpdatedAt);
    });

    it('prefers remote when it is newer', () => {
      const local = {
        progress: createUserProgress({currentStepId: 1}),
        clientUpdatedAt: '2026-09-13T10:00:00.000Z',
        lastSyncedClientUpdatedAt: '2026-09-13T10:00:00.000Z',
      };

      const merged = mergeLocalAndRemoteProgress(local, remote);

      expect(merged?.progress.currentStepId).toBe(2);
    });

    it('keeps local when it is newer', () => {
      const local = {
        progress: createUserProgress({
          currentStepId: 3,
          steps: [
            {
              stepId: 1,
              status: 'completed',
              requirements: {
                passport: {completed: true, source: {type: 'self_declared'}},
              },
            },
          ],
        }),
        clientUpdatedAt: '2026-09-13T14:00:00.000Z',
        lastSyncedClientUpdatedAt: '2026-09-13T14:00:00.000Z',
      };

      const merged = mergeLocalAndRemoteProgress(local, remote);

      expect(merged?.progress.currentStepId).toBe(3);
    });
  });

  describe('fetchMergedProgressStore', () => {
    it('returns null on other-device state', async () => {
      getProfile.mockRejectedValue(new ProfileDecryptionError());

      await expect(fetchMergedProgressStore(null)).resolves.toBeNull();
      expect(fetchRemoteProgressSnapshot).not.toHaveBeenCalled();
    });

    it('fetches and merges when device is authorized', async () => {
      getProfile.mockResolvedValue({personal: {firstName: 'Jane'}});
      fetchRemoteProgressSnapshot.mockResolvedValue({
        currentStepId: 2,
        steps: [],
        clientUpdatedAt: '2026-09-13T12:00:00.000Z',
      });

      const merged = await fetchMergedProgressStore(null);

      expect(fetchRemoteProgressSnapshot).toHaveBeenCalled();
      expect(merged?.progress.currentStepId).toBe(2);
    });
  });
});
