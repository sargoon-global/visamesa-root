import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function saveModelo790ReviewFile(
  file: GeneratedPdfFile,
): Promise<void> {
  await AsyncStorage.setItem(
    MODELO790_REVIEW_FILE_STORAGE_KEY,
    JSON.stringify(file),
  );
}

export async function loadModelo790ReviewFile(): Promise<GeneratedPdfFile | null> {
  const raw = await AsyncStorage.getItem(MODELO790_REVIEW_FILE_STORAGE_KEY);
  return parseGeneratedPdfFile(raw);
}

export async function saveModelo790CompletedFile(
  file: GeneratedPdfFile,
): Promise<void> {
  await AsyncStorage.setItem(
    MODELO790_COMPLETED_FILE_STORAGE_KEY,
    JSON.stringify(file),
  );
}

export async function loadModelo790CompletedFile(): Promise<GeneratedPdfFile | null> {
  const raw = await AsyncStorage.getItem(MODELO790_COMPLETED_FILE_STORAGE_KEY);
  return parseGeneratedPdfFile(raw);
}

export async function setModelo790PendingReview(
  pending: Modelo790PendingReview | null,
): Promise<void> {
  if (!pending) {
    await AsyncStorage.removeItem(MODELO790_REVIEW_PENDING_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(
    MODELO790_REVIEW_PENDING_STORAGE_KEY,
    JSON.stringify(pending),
  );
}

export async function loadModelo790PendingReview(): Promise<Modelo790PendingReview | null> {
  const raw = await AsyncStorage.getItem(MODELO790_REVIEW_PENDING_STORAGE_KEY);
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

export async function clearModelo790LocalSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(MODELO790_REVIEW_FILE_STORAGE_KEY),
    AsyncStorage.removeItem(MODELO790_REVIEW_PENDING_STORAGE_KEY),
    AsyncStorage.removeItem(MODELO790_COMPLETED_FILE_STORAGE_KEY),
  ]);
}
