import type {UserProgress} from '@/features/dashboard/types/UserProgress';

/** Local progress cache plus sync metadata (mirrors server snapshot fields). */
export type LocalProgressStore = {
  progress: UserProgress;
  clientUpdatedAt: string | null;
  lastSyncedClientUpdatedAt: string | null;
};

export type RemoteProgressSnapshot = {
  currentStepId: number;
  steps: UserProgress['steps'];
  clientUpdatedAt: string;
  serverUpdatedAt?: string;
};
