import AsyncStorage from '@react-native-async-storage/async-storage';

import {clearModelo790LocalSession} from '@/features/pdfGeneration/forms/modelo790/modelo790Storage';

import {fetchTieSteps} from '@/features/home/services/tieStepsService';
import {Requirement, TieStepDetail} from '@/features/home/types/TieStepDetail';
import type {LocalProgressStore} from '@/features/dashboard/types/ProgressStore';
import {
  RequirementProgress,
  StepStatus,
  UserProgress,
  UserStepProgress,
} from '@/features/dashboard/types/UserProgress';
import {migrateLegacyPayFeeProgress} from '@/features/dashboard/utils/progressPayFeeMigration';
import {materializeEffectiveRequirements} from '@/features/dashboard/utils/progressUtils';
import {isUserProgressEqual} from '@/features/dashboard/utils/userProgressEquality';
import {
  fetchMergedProgressStore,
  isDeviceAuthorizedForProgress,
} from '@/features/dashboard/services/progressHydrationService';
import {
  hasPendingProgressSync,
  syncProgressSnapshot,
} from '@/features/dashboard/services/progressSyncService';

const PROGRESS_STORAGE_KEY = '@visamesa_user_progress';

let inMemoryStore: LocalProgressStore | null = null;
const progressResetListeners = new Set<() => void>();
const progressStoreChangeListeners = new Set<() => void>();

export function clearProgressMemoryCache(): void {
  inMemoryStore = null;
}

/** Clears local journey progress (e.g. on sign-out so the next account starts fresh). */
export async function clearStoredUserProgress(): Promise<void> {
  inMemoryStore = null;
  await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
  notifyProgressStoreChanged();
  if (__DEV__) {
    progressResetListeners.forEach(listener => listener());
  }
}

export function subscribeToProgressReset(listener: () => void): () => void {
  if (!__DEV__) {
    return () => {};
  }

  progressResetListeners.add(listener);

  return () => {
    progressResetListeners.delete(listener);
  };
}

export function subscribeToProgressStoreChange(listener: () => void): () => void {
  progressStoreChangeListeners.add(listener);

  return () => {
    progressStoreChangeListeners.delete(listener);
  };
}

export function notifyProgressStoreChanged(): void {
  progressStoreChangeListeners.forEach(listener => listener());
}

const createEmptyRequirementProgress = (): RequirementProgress => ({
  completed: false,
});

const buildInitialStepProgress = (
  stepId: number,
  requirements: Requirement[],
): UserStepProgress => ({
  stepId,
  status: 'not_started',
  requirements: requirements.reduce<Record<string, RequirementProgress>>(
    (acc, requirement) => {
      acc[requirement.key] = createEmptyRequirementProgress();
      return acc;
    },
    {},
  ),
});

export async function createInitialProgress(): Promise<UserProgress> {
  const steps = await fetchTieSteps();

  return buildInitialProgressFromSteps(steps);
}

export function buildInitialProgressFromSteps(
  steps: Array<{id: number; requirements: Requirement[]}>,
): UserProgress {
  return {
    currentStepId: 1,
    steps: steps.map(step =>
      buildInitialStepProgress(step.id, step.requirements),
    ),
  };
}

function createInitialStore(progress: UserProgress): LocalProgressStore {
  return {
    progress,
    clientUpdatedAt: null,
    lastSyncedClientUpdatedAt: null,
  };
}

function mergeProgressWithStepDefinitions(
  stored: UserProgress,
  steps: TieStepDetail[],
): UserProgress {
  const migrated = migrateLegacyPayFeeProgress(stored);

  return {
    currentStepId: migrated.currentStepId,
    steps: steps.map(stepDefinition => {
      const existing = migrated.steps.find(
        stepProgress => stepProgress.stepId === stepDefinition.id,
      );

      if (!existing) {
        return buildInitialStepProgress(
          stepDefinition.id,
          stepDefinition.requirements,
        );
      }

      const requirements = stepDefinition.requirements.reduce<
        Record<string, RequirementProgress>
      >((acc, requirement) => {
        acc[requirement.key] =
          existing.requirements[requirement.key] ??
          createEmptyRequirementProgress();
        return acc;
      }, {});

      return {
        ...existing,
        requirements,
      };
    }),
  };
}

const mergeProgressWithSteps = async (
  stored: UserProgress,
  prefetchedSteps?: TieStepDetail[],
): Promise<UserProgress> => {
  const steps = prefetchedSteps ?? (await fetchTieSteps());
  return mergeProgressWithStepDefinitions(stored, steps);
};

async function mergeStoreWithSteps(
  store: LocalProgressStore,
  prefetchedSteps?: TieStepDetail[],
): Promise<{store: LocalProgressStore; steps: TieStepDetail[]}> {
  const steps = prefetchedSteps ?? (await fetchTieSteps());

  return {
    store: {
      ...store,
      progress: mergeProgressWithStepDefinitions(store.progress, steps),
    },
    steps,
  };
}

async function readStoredProgressStore(): Promise<LocalProgressStore | null> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LocalProgressStore;

    if (!parsed?.progress?.steps) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function writeStoredProgressStore(store: LocalProgressStore): Promise<void> {
  inMemoryStore = store;
  await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
}

function scheduleAuthorizedProgressSync(store: LocalProgressStore): void {
  if (!hasPendingProgressSync(store)) {
    return;
  }

  void (async () => {
    try {
      if (!(await isDeviceAuthorizedForProgress())) {
        return;
      }

      const synced = await syncProgressSnapshot(store);
      const {store: next} = await mergeStoreWithSteps(synced);
      await writeStoredProgressStore(next);
      notifyProgressStoreChanged();
    } catch {
      // Best-effort background sync
    }
  })();
}

async function applyMaterializedStore(
  merged: LocalProgressStore,
  steps: TieStepDetail[],
): Promise<LocalProgressStore> {
  const ready = await materializeStoreProgress(merged, steps);

  if (isUserProgressEqual(merged.progress, ready.progress)) {
    inMemoryStore = merged;
    return merged;
  }

  inMemoryStore = ready;
  await writeStoredProgressStore(ready);
  scheduleAuthorizedProgressSync(ready);
  return ready;
}

async function loadProgressStore(): Promise<LocalProgressStore> {
  if (inMemoryStore) {
    const {store: merged, steps} = await mergeStoreWithSteps(inMemoryStore);
    return applyMaterializedStore(merged, steps);
  }

  const stored = await readStoredProgressStore();

  if (stored) {
    const {store: merged, steps} = await mergeStoreWithSteps(stored);
    return applyMaterializedStore(merged, steps);
  }

  const initial = createInitialStore(await createInitialProgress());
  await writeStoredProgressStore(initial);
  return initial;
}

export async function fetchUserProgress(): Promise<UserProgress> {
  const store = await loadProgressStore();
  return store.progress;
}

export async function fetchLocalProgressStore(): Promise<LocalProgressStore> {
  return loadProgressStore();
}

/**
 * Restores dashboard progress from the server when this install is device-authorized.
 * No-op on other-device state (encrypted profile from another device).
 */
export async function tryHydrateProgressFromServer(): Promise<boolean> {
  const local = await loadProgressStore();
  const merged = await fetchMergedProgressStore(local);

  if (!merged) {
    return false;
  }

  const {store: hydrated} = await mergeStoreWithSteps(merged);
  await writeStoredProgressStore(hydrated);
  notifyProgressStoreChanged();
  return true;
}

async function materializeStoreProgress(
  store: LocalProgressStore,
  steps: TieStepDetail[],
): Promise<LocalProgressStore> {
  const progress = materializeEffectiveRequirements(store.progress, steps, {
    allSteps: steps,
  });

  if (isUserProgressEqual(store.progress, progress)) {
    return store;
  }

  return {
    ...store,
    progress,
    clientUpdatedAt: new Date().toISOString(),
  };
}

async function persistProgressStore(
  store: LocalProgressStore,
  options: {sync?: boolean} = {},
): Promise<LocalProgressStore> {
  const {store: merged, steps} = await mergeStoreWithSteps(store);
  const ready = await materializeStoreProgress(merged, steps);
  await writeStoredProgressStore(ready);

  if (options.sync !== false) {
    scheduleAuthorizedProgressSync(ready);
  }

  return ready;
}

async function persistProgressMutation(
  progress: UserProgress,
): Promise<UserProgress> {
  const current = await loadProgressStore();
  const clientUpdatedAt = new Date().toISOString();
  const store: LocalProgressStore = {
    progress,
    clientUpdatedAt,
    lastSyncedClientUpdatedAt: current.lastSyncedClientUpdatedAt,
  };

  const saved = await persistProgressStore(store);
  return saved.progress;
}

export async function saveUserProgress(
  progress: UserProgress,
): Promise<UserProgress> {
  return persistProgressMutation(progress);
}

/** Saves hydrated/server progress without pushing to the backend. */
export async function saveUserProgressWithoutSync(
  progress: UserProgress,
  clientUpdatedAt: string | null,
): Promise<UserProgress> {
  const store: LocalProgressStore = {
    progress,
    clientUpdatedAt,
    lastSyncedClientUpdatedAt: clientUpdatedAt,
  };
  const saved = await persistProgressStore(store, {sync: false});
  return saved.progress;
}

export async function updateStepStatus(
  progress: UserProgress,
  stepId: number,
  status: StepStatus,
): Promise<UserProgress> {
  const now = new Date().toISOString();

  const steps = progress.steps.map(step => {
    if (step.stepId !== stepId) {
      return step;
    }

    if (status === 'in_progress') {
      return {
        ...step,
        status,
        startedAt: step.startedAt ?? now,
      };
    }

    if (status === 'completed') {
      return {
        ...step,
        status,
        completedAt: now,
      };
    }

    return {...step, status};
  });

  return persistProgressMutation({...progress, steps});
}

export async function updateRequirementProgress(
  progress: UserProgress,
  stepId: number,
  requirementLabel: string,
  requirementProgress: RequirementProgress,
): Promise<UserProgress> {
  const steps = progress.steps.map(step => {
    if (step.stepId !== stepId) {
      return step;
    }

    return {
      ...step,
      requirements: {
        ...step.requirements,
        [requirementLabel]: requirementProgress,
      },
    };
  });

  return persistProgressMutation({...progress, steps});
}

export async function setCurrentStepId(
  progress: UserProgress,
  currentStepId: number,
): Promise<UserProgress> {
  return persistProgressMutation({...progress, currentStepId});
}

export async function syncStoredProgressToBackend(options?: {
  strict?: boolean;
}): Promise<void> {
  const store = await loadProgressStore();

  if (!hasPendingProgressSync(store)) {
    return;
  }

  const {isDeviceAuthorizedForProgress} = await import(
    '@/features/dashboard/services/progressHydrationService'
  );

  if (!(await isDeviceAuthorizedForProgress())) {
    if (options?.strict) {
      throw new Error('Progress sync requires device authorization');
    }
    return;
  }

  try {
    const synced = await syncProgressSnapshot(store);
    const {store: next} = await mergeStoreWithSteps(synced);
    await writeStoredProgressStore(next);
    notifyProgressStoreChanged();
  } catch (error) {
    if (options?.strict) {
      throw error;
    }
    // Best-effort foreground sync
  }
}

/** Clears stored progress — dev and test only */
export async function resetUserProgress(): Promise<void> {
  if (!__DEV__) {
    return;
  }

  inMemoryStore = null;
  await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
  await clearModelo790LocalSession();
  progressResetListeners.forEach(listener => listener());
}
