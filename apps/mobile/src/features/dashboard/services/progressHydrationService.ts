import {getProfile} from '@/features/profile/services/profileService';
import {ProfileDecryptionError} from '@/services/profileCryptoErrors';
import type {LocalProgressStore} from '@/features/dashboard/types/ProgressStore';
import type {RemoteProgressSnapshot} from '@/features/dashboard/types/ProgressStore';
import {
  fetchRemoteProgressSnapshot,
  remoteSnapshotToStore,
} from '@/features/dashboard/services/progressSyncService';
import {isPristineProgress} from '@/features/dashboard/utils/progressPristine';

export async function isDeviceAuthorizedForProgress(): Promise<boolean> {
  try {
    await getProfile();
    return true;
  } catch (error) {
    if (error instanceof ProfileDecryptionError) {
      return false;
    }

    throw error;
  }
}

export function mergeLocalAndRemoteProgress(
  local: LocalProgressStore | null,
  remote: RemoteProgressSnapshot | null,
): LocalProgressStore | null {
  if (!remote) {
    return local;
  }

  if (!local || isPristineProgress(local.progress)) {
    return remoteSnapshotToStore(remote);
  }

  const localTime = local.clientUpdatedAt
    ? Date.parse(local.clientUpdatedAt)
    : 0;
  const remoteTime = Date.parse(remote.clientUpdatedAt);

  if (remoteTime >= localTime) {
    return remoteSnapshotToStore(remote);
  }

  return local;
}

/**
 * Pulls the server snapshot when this install is allowed to use account progress.
 * Skips on other-device state (profile ciphertext from another device).
 */
export async function fetchMergedProgressStore(
  local: LocalProgressStore | null,
): Promise<LocalProgressStore | null> {
  const authorized = await isDeviceAuthorizedForProgress();

  if (!authorized) {
    return null;
  }

  const remote = await fetchRemoteProgressSnapshot();

  return mergeLocalAndRemoteProgress(local, remote);
}
