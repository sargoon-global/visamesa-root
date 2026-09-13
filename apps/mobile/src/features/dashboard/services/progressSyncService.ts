import {API_ENDPOINTS} from '@/config/api';
import apiClient from '@/services/api';
import {reportClientErrorFromException} from '@/services/clientErrorService';
import type {LocalProgressStore} from '@/features/dashboard/types/ProgressStore';
import type {RemoteProgressSnapshot} from '@/features/dashboard/types/ProgressStore';
import type {UserProgress} from '@/features/dashboard/types/UserProgress';

type ProgressApiPayload = {
  progress: RemoteProgressSnapshot | null;
};

function toUserProgress(snapshot: RemoteProgressSnapshot): UserProgress {
  return {
    currentStepId: snapshot.currentStepId,
    steps: snapshot.steps,
  };
}

export async function fetchRemoteProgressSnapshot(): Promise<RemoteProgressSnapshot | null> {
  const response = await apiClient.get<ProgressApiPayload>(
    API_ENDPOINTS.userProgress,
  );

  return response.data.progress;
}

export async function syncProgressSnapshot(
  store: LocalProgressStore,
): Promise<LocalProgressStore> {
  if (!store.clientUpdatedAt) {
    return store;
  }

  try {
    const response = await apiClient.put<ProgressApiPayload>(
      API_ENDPOINTS.userProgress,
      {
        currentStepId: store.progress.currentStepId,
        steps: store.progress.steps,
        clientUpdatedAt: store.clientUpdatedAt,
      },
    );

    const remote = response.data.progress;

    if (!remote) {
      return {
        ...store,
        lastSyncedClientUpdatedAt: store.clientUpdatedAt,
      };
    }

    return {
      progress: toUserProgress(remote),
      clientUpdatedAt: remote.clientUpdatedAt,
      lastSyncedClientUpdatedAt: remote.clientUpdatedAt,
    };
  } catch (error) {
    reportClientErrorFromException('PROGRESS_SYNC_FAILED', error, {
      currentStepId: store.progress.currentStepId,
    });
    throw error;
  }
}

export function remoteSnapshotToStore(
  snapshot: RemoteProgressSnapshot,
): LocalProgressStore {
  return {
    progress: toUserProgress(snapshot),
    clientUpdatedAt: snapshot.clientUpdatedAt,
    lastSyncedClientUpdatedAt: snapshot.clientUpdatedAt,
  };
}

export function hasPendingProgressSync(store: LocalProgressStore): boolean {
  if (!store.clientUpdatedAt) {
    return false;
  }

  return store.lastSyncedClientUpdatedAt !== store.clientUpdatedAt;
}
