import {createUserProgress} from '@/test/fixtures/userProgress';

import {
  hasPendingProgressSync,
  remoteSnapshotToStore,
  syncProgressSnapshot,
} from './progressSyncService';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('@/services/clientErrorService', () => ({
  reportClientErrorFromException: jest.fn(),
}));

const apiClient = jest.requireMock('@/services/api').default as {
  get: jest.Mock;
  put: jest.Mock;
};

describe('progressSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPendingProgressSync', () => {
    it('returns false when clientUpdatedAt is null', () => {
      expect(
        hasPendingProgressSync({
          progress: createUserProgress(),
          clientUpdatedAt: null,
          lastSyncedClientUpdatedAt: null,
        }),
      ).toBe(false);
    });

    it('returns true when local edits have not synced', () => {
      expect(
        hasPendingProgressSync({
          progress: createUserProgress(),
          clientUpdatedAt: '2026-09-13T12:00:00.000Z',
          lastSyncedClientUpdatedAt: '2026-09-13T10:00:00.000Z',
        }),
      ).toBe(true);
    });

    it('returns false when already synced', () => {
      const timestamp = '2026-09-13T12:00:00.000Z';

      expect(
        hasPendingProgressSync({
          progress: createUserProgress(),
          clientUpdatedAt: timestamp,
          lastSyncedClientUpdatedAt: timestamp,
        }),
      ).toBe(false);
    });
  });

  describe('syncProgressSnapshot', () => {
    it('skips PUT when clientUpdatedAt is null', async () => {
      const store = {
        progress: createUserProgress(),
        clientUpdatedAt: null,
        lastSyncedClientUpdatedAt: null,
      };

      await expect(syncProgressSnapshot(store)).resolves.toBe(store);
      expect(apiClient.put).not.toHaveBeenCalled();
    });

    it('updates lastSyncedClientUpdatedAt from PUT response', async () => {
      const clientUpdatedAt = '2026-09-13T12:00:00.000Z';
      const store = {
        progress: createUserProgress({currentStepId: 2}),
        clientUpdatedAt,
        lastSyncedClientUpdatedAt: null,
      };

      apiClient.put.mockResolvedValue({
        data: {
          progress: {
            currentStepId: 2,
            steps: store.progress.steps,
            clientUpdatedAt,
          },
        },
      });

      const synced = await syncProgressSnapshot(store);

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          currentStepId: 2,
          clientUpdatedAt,
        }),
      );
      expect(synced.lastSyncedClientUpdatedAt).toBe(clientUpdatedAt);
    });
  });

  describe('remoteSnapshotToStore', () => {
    it('maps remote snapshot to local store', () => {
      const snapshot = {
        currentStepId: 3,
        steps: [],
        clientUpdatedAt: '2026-09-13T12:00:00.000Z',
      };

      const store = remoteSnapshotToStore(snapshot);

      expect(store.progress.currentStepId).toBe(3);
      expect(store.clientUpdatedAt).toBe(snapshot.clientUpdatedAt);
      expect(store.lastSyncedClientUpdatedAt).toBe(snapshot.clientUpdatedAt);
    });
  });
});
