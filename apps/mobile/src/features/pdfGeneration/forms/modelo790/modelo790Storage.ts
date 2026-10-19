import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '@visamesa/types';

import type {GeneratedPdfFile} from '@/features/pdfGeneration/services/pdfFileService';

import {
  MODELO790_COMPLETED_FILE_STORAGE_KEY,
  MODELO790_REVIEW_FILE_STORAGE_KEY,
  MODELO790_REVIEW_PENDING_STORAGE_KEY,
} from './modelo790Constants';

export type Modelo790PendingReview = {
  requirementKey: string;
  formId: string;
  stepId: number;
  showNextStepsAlert?: boolean;
};

function scopedStorageKey(baseKey: string, userId: string): string {
  return `${baseKey}:${userId}`;
}

async function getActiveUserId(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as {id?: string};
    return typeof user.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

async function resolveUserId(userId?: string | null): Promise<string | null> {
  if (userId) {
    return userId;
  }
  return getActiveUserId();
}

function parseGeneratedPdfFile(raw: string | null): GeneratedPdfFile | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as GeneratedPdfFile;
    if (
      typeof parsed.fileName === 'string' &&
      typeof parsed.path === 'string' &&
      typeof parsed.uri === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

async function loadScopedOrLegacyFile(
  baseKey: string,
  userId: string | null,
): Promise<GeneratedPdfFile | null> {
  if (userId) {
    const scoped = await AsyncStorage.getItem(
      scopedStorageKey(baseKey, userId),
    );
    const parsedScoped = parseGeneratedPdfFile(scoped);
    if (parsedScoped) {
      return parsedScoped;
    }
  }

  return parseGeneratedPdfFile(await AsyncStorage.getItem(baseKey));
}

async function saveScopedFile(
  baseKey: string,
  file: GeneratedPdfFile,
  userId: string | null,
): Promise<void> {
  const payload = JSON.stringify(file);
  if (userId) {
    await AsyncStorage.setItem(scopedStorageKey(baseKey, userId), payload);
    await AsyncStorage.removeItem(baseKey);
    return;
  }

  await AsyncStorage.setItem(baseKey, payload);
}

export async function saveModelo790ReviewFile(
  file: GeneratedPdfFile,
  userId?: string | null,
): Promise<void> {
  const resolvedUserId = await resolveUserId(userId);
  await saveScopedFile(MODELO790_REVIEW_FILE_STORAGE_KEY, file, resolvedUserId);
}

export async function loadModelo790ReviewFile(
  userId?: string | null,
): Promise<GeneratedPdfFile | null> {
  const resolvedUserId = await resolveUserId(userId);
  return loadScopedOrLegacyFile(
    MODELO790_REVIEW_FILE_STORAGE_KEY,
    resolvedUserId,
  );
}

export async function saveModelo790CompletedFile(
  file: GeneratedPdfFile,
  userId?: string | null,
): Promise<void> {
  const resolvedUserId = await resolveUserId(userId);
  await saveScopedFile(
    MODELO790_COMPLETED_FILE_STORAGE_KEY,
    file,
    resolvedUserId,
  );
}

export async function loadModelo790CompletedFile(
  userId?: string | null,
): Promise<GeneratedPdfFile | null> {
  const resolvedUserId = await resolveUserId(userId);
  return loadScopedOrLegacyFile(
    MODELO790_COMPLETED_FILE_STORAGE_KEY,
    resolvedUserId,
  );
}

export async function setModelo790PendingReview(
  pending: Modelo790PendingReview | null,
  userId?: string | null,
): Promise<void> {
  const resolvedUserId = await resolveUserId(userId);
  const pendingKey = resolvedUserId
    ? scopedStorageKey(MODELO790_REVIEW_PENDING_STORAGE_KEY, resolvedUserId)
    : MODELO790_REVIEW_PENDING_STORAGE_KEY;

  if (!pending) {
    await AsyncStorage.removeItem(pendingKey);
    if (resolvedUserId) {
      await AsyncStorage.removeItem(MODELO790_REVIEW_PENDING_STORAGE_KEY);
    }
    return;
  }

  await AsyncStorage.setItem(pendingKey, JSON.stringify(pending));
  if (resolvedUserId) {
    await AsyncStorage.removeItem(MODELO790_REVIEW_PENDING_STORAGE_KEY);
  }
}

export async function loadModelo790PendingReview(
  userId?: string | null,
): Promise<Modelo790PendingReview | null> {
  const resolvedUserId = await resolveUserId(userId);
  const raw = resolvedUserId
    ? ((await AsyncStorage.getItem(
        scopedStorageKey(MODELO790_REVIEW_PENDING_STORAGE_KEY, resolvedUserId),
      )) ??
      (await AsyncStorage.getItem(MODELO790_REVIEW_PENDING_STORAGE_KEY)))
    : await AsyncStorage.getItem(MODELO790_REVIEW_PENDING_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Modelo790PendingReview;
    if (
      typeof parsed.requirementKey === 'string' &&
      typeof parsed.formId === 'string' &&
      typeof parsed.stepId === 'number'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

/** Clears in-progress review state; keeps approved PDF for the user on this device. */
export async function clearModelo790InProgressSession(
  userId?: string | null,
): Promise<void> {
  const resolvedUserId = await resolveUserId(userId);
  const keys = [
    MODELO790_REVIEW_FILE_STORAGE_KEY,
    MODELO790_REVIEW_PENDING_STORAGE_KEY,
  ];

  await Promise.all(
    keys.flatMap(key => {
      const removals = [AsyncStorage.removeItem(key)];
      if (resolvedUserId) {
        removals.push(
          AsyncStorage.removeItem(scopedStorageKey(key, resolvedUserId)),
        );
      }
      return removals;
    }),
  );
}

/** Clears all Modelo 790 local data for the user (e.g. progress reset). */
export async function clearModelo790LocalSession(
  userId?: string | null,
): Promise<void> {
  const resolvedUserId = await resolveUserId(userId);
  const keys = [
    MODELO790_REVIEW_FILE_STORAGE_KEY,
    MODELO790_REVIEW_PENDING_STORAGE_KEY,
    MODELO790_COMPLETED_FILE_STORAGE_KEY,
  ];

  await Promise.all(
    keys.flatMap(key => {
      const removals = [AsyncStorage.removeItem(key)];
      if (resolvedUserId) {
        removals.push(
          AsyncStorage.removeItem(scopedStorageKey(key, resolvedUserId)),
        );
      }
      return removals;
    }),
  );
}
