import {act} from 'react';

import {useProfile} from '@/features/profile/hooks/useProfile';
import {
  getProfile,
  updateProfile,
} from '@/features/profile/services/profileService';
import {renderHookAsync, unmountRenderedHook} from '@/test/renderHook';

const mockShowToast = jest.fn();
const mockFetchUserProgress = jest.fn();
const mockSaveUserProgress = jest.fn();
const mockTryHydrateProgressFromServer = jest.fn();
const mockSyncEmpadronamiento = jest.fn();
const mockReconcileStepStatuses = jest.fn();
const mockFetchTieSteps = jest.fn();

jest.mock('@/components/Toast/ToastProvider', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

jest.mock('@/features/profile/services/profileService', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  EMPTY_PROFILE: {personal: {}},
}));

jest.mock('@/features/dashboard/services/progressService', () => ({
  fetchUserProgress: (...args: unknown[]) => mockFetchUserProgress(...args),
  saveUserProgress: (...args: unknown[]) => mockSaveUserProgress(...args),
  tryHydrateProgressFromServer: (...args: unknown[]) =>
    mockTryHydrateProgressFromServer(...args),
}));

jest.mock('@/features/dashboard/services/empadronamientoProgressService', () => ({
  syncEmpadronamientoStepFromProfile: (...args: unknown[]) =>
    mockSyncEmpadronamiento(...args),
}));

jest.mock('@/features/dashboard/services/progressReconciliationService', () => ({
  reconcileStepStatuses: (...args: unknown[]) => mockReconcileStepStatuses(...args),
}));

jest.mock('@/features/home/services/tieStepsService', () => ({
  fetchTieSteps: (...args: unknown[]) => mockFetchTieSteps(...args),
}));

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getProfile as jest.Mock).mockResolvedValue({
      personal: {
        firstName: 'Jane',
        lastName: 'Doe',
        hasEmpadronamiento: 'no',
      },
    });
    mockFetchUserProgress.mockResolvedValue({steps: []});
    mockTryHydrateProgressFromServer.mockResolvedValue(false);
    mockFetchTieSteps.mockResolvedValue([]);
    mockSyncEmpadronamiento.mockImplementation(progress => progress);
    mockReconcileStepStatuses.mockImplementation(progress => ({
      ...progress,
      currentStepId: (progress.currentStepId ?? 1) + 1,
    }));
  });

  afterEach(() => {
    unmountRenderedHook();
  });

  it('loads profile data when enabled', async () => {
    const getHookState = await renderHookAsync(
      () => useProfile(true),
      state => !state.isLoading,
    );

    expect(getProfile).toHaveBeenCalled();
    expect(mockTryHydrateProgressFromServer).toHaveBeenCalled();
    expect(getHookState().profileData?.personal?.firstName).toBe('Jane');
  });

  it('prefills email from the authenticated user when profile email is empty', async () => {
    const getHookState = await renderHookAsync(
      () => useProfile(true, 'jane@example.com'),
      state => !state.isLoading,
    );

    expect(getHookState().personalInitialValues.email).toBe('jane@example.com');
  });

  it('treats auth email as complete when profile email is empty', async () => {
    (getProfile as jest.Mock).mockResolvedValue({
      personal: {
        firstName: 'Jane',
        lastName: 'Doe',
        gender: 'female',
        dateOfBirth: '1990-01-01',
        cityOfBirth: 'Madrid',
        countryOfBirth: 'Spain',
        nationality: 'Spain',
        maritalStatus: 'single',
        fatherName: 'John Doe',
        motherName: 'Mary Doe',
        nieNumber: 'X1234567A',
        passportNumber: 'AB123456',
        phoneNumber: {countryCode: '+34', number: '600000000'},
        address: 'Carrer Example',
        addressNumber: '1',
        city: 'Barcelona',
        province: 'Barcelona',
        postalCode: '08001',
        hasEmpadronamiento: 'no',
      },
    });

    const getHookState = await renderHookAsync(
      () => useProfile(true, 'jane@example.com'),
      state => !state.isLoading,
    );

    expect(getHookState().isProfileComplete).toBe(true);
  });

  it('keeps stored profile email over the authenticated user email', async () => {
    (getProfile as jest.Mock).mockResolvedValue({
      personal: {
        firstName: 'Jane',
        email: 'saved@example.com',
      },
    });

    const getHookState = await renderHookAsync(
      () => useProfile(true, 'jane@example.com'),
      state => !state.isLoading,
    );

    expect(getHookState().personalInitialValues.email).toBe('saved@example.com');
  });

  it('syncs dashboard progress after saving personal information', async () => {
    (updateProfile as jest.Mock).mockResolvedValue({
      personal: {
        firstName: 'Jane',
        lastName: 'Doe',
        hasEmpadronamiento: 'yes',
        empadronamientoIssuedAt: '2026-01-01',
      },
    });

    const getHookState = await renderHookAsync(
      () => useProfile(true),
      state => !state.isLoading,
    );

    await act(async () => {
      await getHookState().submitPersonal({
        firstName: 'Jane',
        lastName: 'Doe',
        hasEmpadronamiento: 'yes',
        empadronamientoIssuedAt: '2026-01-01',
      });
    });

    expect(updateProfile).toHaveBeenCalledWith(
      'personal',
      expect.objectContaining({
        firstName: 'Jane',
        hasEmpadronamiento: 'yes',
      }),
    );
    expect(mockTryHydrateProgressFromServer).toHaveBeenCalled();
    expect(mockFetchUserProgress).toHaveBeenCalled();
    expect(mockSyncEmpadronamiento).toHaveBeenCalled();
    expect(mockReconcileStepStatuses).toHaveBeenCalled();
    expect(mockSaveUserProgress).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalled();
  });
});
