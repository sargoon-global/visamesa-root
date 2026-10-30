import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '@visamesa/types';

const mockStorageMap = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) =>
    Promise.resolve(mockStorageMap.get(key) ?? null),
  ),
  setItem: jest.fn((key: string, value: string) => {
    mockStorageMap.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockStorageMap.delete(key);
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(key => mockStorageMap.delete(key));
    return Promise.resolve();
  }),
}));

import {
  clearModelo790InProgressSession,
  clearModelo790LocalSession,
  loadModelo790CompletedFile,
  loadModelo790PendingReview,
  loadModelo790ReviewFile,
  saveModelo790CompletedFile,
  saveModelo790ReviewFile,
  setModelo790PendingReview,
} from './modelo790Storage';
import {
  MODELO790_COMPLETED_FILE_STORAGE_KEY,
  MODELO790_REVIEW_FILE_STORAGE_KEY,
  MODELO790_REVIEW_PENDING_STORAGE_KEY,
} from './modelo790Constants';

const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const USER_ID = 'user-1';
const userDataKey = `${STORAGE_KEYS.USER_DATA}`;

function seedUser() {
  mockStorageMap.set(userDataKey, JSON.stringify({id: USER_ID, email: 'a@b.c'}));
}

describe('modelo790Storage', () => {
  beforeEach(() => {
    mockStorageMap.clear();
    jest.clearAllMocks();
    seedUser();
  });

  it('persists and loads pending review metadata per user', async () => {
    await setModelo790PendingReview({
      requirementKey: 'modelo-790-form',
      formId: 'modelo-790-012',
      stepId: 3,
      showNextStepsAlert: true,
    });

    await expect(loadModelo790PendingReview()).resolves.toEqual({
      requirementKey: 'modelo-790-form',
      formId: 'modelo-790-012',
      stepId: 3,
      showNextStepsAlert: true,
    });
  });

  it('clears all local Modelo 790 keys for the signed-in user', async () => {
    await clearModelo790LocalSession(USER_ID);

    expect(asyncStorage.removeItem).toHaveBeenCalledWith(
      MODELO790_REVIEW_FILE_STORAGE_KEY,
    );
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(
      `${MODELO790_REVIEW_FILE_STORAGE_KEY}:${USER_ID}`,
    );
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(
      MODELO790_REVIEW_PENDING_STORAGE_KEY,
    );
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(
      `${MODELO790_REVIEW_PENDING_STORAGE_KEY}:${USER_ID}`,
    );
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(
      MODELO790_COMPLETED_FILE_STORAGE_KEY,
    );
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(
      `${MODELO790_COMPLETED_FILE_STORAGE_KEY}:${USER_ID}`,
    );
  });

  it('clears in-progress keys but keeps the approved PDF on logout', async () => {
    const file = {
      fileName: 'modelo-790-012-1.pdf',
      path: '/tmp/modelo.pdf',
      uri: 'file:///tmp/modelo.pdf',
    };

    await saveModelo790ReviewFile(file);
    await saveModelo790CompletedFile(file);
    await clearModelo790InProgressSession(USER_ID);

    await expect(loadModelo790CompletedFile()).resolves.toEqual(file);
    await expect(loadModelo790ReviewFile()).resolves.toBeNull();
  });

  it('stores generated PDF metadata under the user scope', async () => {
    const file = {
      fileName: 'modelo-790-012-1.pdf',
      path: '/tmp/modelo.pdf',
      uri: 'file:///tmp/modelo.pdf',
    };

    await saveModelo790ReviewFile(file);

    expect(asyncStorage.setItem).toHaveBeenCalledWith(
      `${MODELO790_REVIEW_FILE_STORAGE_KEY}:${USER_ID}`,
      JSON.stringify(file),
    );
  });
});
