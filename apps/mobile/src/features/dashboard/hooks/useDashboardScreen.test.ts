import {act} from 'react';
import {buildTieSteps, createTieStepsTranslator} from '@visamesa/content/tieSteps/detail';
import {i18n} from '@visamesa/content/i18n';

import {useDashboardScreen} from '@/features/dashboard/hooks/useDashboardScreen';
import {createTieSteps} from '@/test/fixtures/tieSteps';
import {createUserProgress} from '@/test/fixtures/userProgress';
import {createMockNavigation} from '@/test/navigation';
import {renderHook, flushAsyncEffects} from '@/test/renderHook';

const mockShowToast = jest.fn();
const mockUseProcessReadiness = jest.fn();
const mockRefreshReadiness = jest.fn(() => Promise.resolve());

async function renderDashboardScreen(
  navigation: Parameters<typeof useDashboardScreen>[0],
) {
  const getHookState = renderHook(() => useDashboardScreen(navigation));
  await flushAsyncEffects();
  return getHookState;
}

jest.mock('@/features/home/hooks/useTieSteps', () => ({
  useTieSteps: jest.fn(),
}));

jest.mock('@/features/dashboard/hooks/useUserProgress', () => ({
  useUserProgress: jest.fn(),
}));

type DashboardAuthMockValue = {
  user: {id: string; email: string} | null;
  isLoading: boolean;
};

const mockUseAuth = jest.fn((): DashboardAuthMockValue => ({
  user: {id: 'test', email: 'test@example.com'},
  isLoading: false,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/components/Toast/ToastProvider', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

jest.mock('@/contexts/EntitlementsContext', () => ({
  useEntitlements: () => ({
    hasPaidService: () => true,
    canUseBookingAssistant: () => true,
    isLoading: false,
    refreshEntitlements: jest.fn(),
  }),
}));

jest.mock('@/hooks/useProcessReadiness', () => ({
  useProcessReadiness: () => mockUseProcessReadiness(),
}));

jest.mock('@/features/profile/services/profileService', () => ({
  getProfile: jest.fn(() => Promise.resolve({personal: null})),
  loadBookingAssistantInjectionProfiles: jest.fn(() =>
    Promise.resolve({
      personal: {
        firstName: 'Jane',
        lastName: 'Doe',
        nieNumber: 'X1234567L',
        passportNumber: 'A12345678',
        phoneNumber: '600123456',
        email: 'jane@example.com',
      },
      empadronamiento: {},
      citaPrevia: {},
    }),
  ),
}));

jest.mock('@/features/dashboard/services/empadronamientoProgressService', () => ({
  syncEmpadronamientoStepFromProfile: jest.fn((progress: unknown) =>
    Promise.resolve(progress),
  ),
}));

jest.mock('@/features/dashboard/services/progressService', () => ({
  saveUserProgress: jest.fn((progress: unknown) => Promise.resolve(progress)),
  subscribeToProgressReset: jest.fn(() => () => {}),
  buildInitialProgressFromSteps: (
    steps: Array<{id: number; requirements: Array<{key: string}>}>,
  ) => ({
    currentStepId: 1,
    steps: steps.map(step => ({
      stepId: step.id,
      status: 'not_started',
      requirements: step.requirements.reduce<Record<string, {completed: boolean}>>(
        (acc, requirement) => {
          acc[requirement.key] = {completed: false};
          return acc;
        },
        {},
      ),
    })),
  }),
}));

jest.mock('@/navigation/navigationRef', () => ({
  navigateToProfile: jest.fn(),
}));

jest.mock('@/hooks/usePricingLink', () => ({
  usePricingLink: () => ({
    openPricing: jest.fn(),
  }),
}));

const mockShowAlert = jest.fn();

jest.mock('@/contexts/AppDialogContext', () => ({
  useAppDialog: () => ({
    showAlert: mockShowAlert,
    showDialog: jest.fn(),
    closeDialog: jest.fn(),
  }),
  AppDialogProvider: ({children}: {children: React.ReactNode}) => children,
}));

const mockSaveEx17Pdf = jest.fn();
const mockOpenGeneratedPdf = jest.fn();
const mockShareGeneratedPdf = jest.fn();
const mockDownloadEx17PdfToDevice = jest.fn();

jest.mock('@/features/pdfGeneration/forms/ex17/ex17PdfService', () => ({
  saveEx17Pdf: (...args: unknown[]) => mockSaveEx17Pdf(...args),
  openGeneratedPdf: (...args: unknown[]) => mockOpenGeneratedPdf(...args),
  shareGeneratedPdf: (...args: unknown[]) => mockShareGeneratedPdf(...args),
  downloadEx17PdfToDevice: (...args: unknown[]) =>
    mockDownloadEx17PdfToDevice(...args),
  PdfDownloadDismissedError: class PdfDownloadDismissedError extends Error {
    constructor() {
      super('PDF download dismissed');
      this.name = 'PdfDownloadDismissedError';
    }
  },
}));

const {useTieSteps} = jest.requireMock('@/features/home/hooks/useTieSteps') as {
  useTieSteps: jest.Mock;
};

const {useUserProgress} = jest.requireMock(
  '@/features/dashboard/hooks/useUserProgress',
) as {useUserProgress: jest.Mock};

describe('useDashboardScreen', () => {
  const completeStep = jest.fn();
  const toggleSelfDeclaredRequirement = jest.fn();
  const completeBookingAssistantRequirement = jest.fn();
  const clearBookingAssistantRequirement = jest.fn();
  const completeFormRequirement = jest.fn();

  beforeEach(() => {
    mockShowToast.mockReset();
    mockShowAlert.mockReset();
    mockSaveEx17Pdf.mockReset();
    mockOpenGeneratedPdf.mockReset();
    mockShareGeneratedPdf.mockReset();
    mockDownloadEx17PdfToDevice.mockReset();
    mockSaveEx17Pdf.mockResolvedValue({
      fileName: 'ex17-tie-test.pdf',
      path: '/tmp/ex17-tie-test.pdf',
      uri: 'file:///tmp/ex17-tie-test.pdf',
    });
    mockOpenGeneratedPdf.mockResolvedValue(undefined);
    mockShareGeneratedPdf.mockResolvedValue(undefined);
    mockDownloadEx17PdfToDevice.mockResolvedValue(undefined);
    mockRefreshReadiness.mockReset();
    mockRefreshReadiness.mockResolvedValue(undefined);
    completeStep.mockReset();
    toggleSelfDeclaredRequirement.mockReset();
    completeBookingAssistantRequirement.mockReset();
    clearBookingAssistantRequirement.mockReset();
    completeFormRequirement.mockReset();
    mockUseAuth.mockReturnValue({
      user: {id: 'test', email: 'test@example.com'},
      isLoading: false,
    });

    mockUseProcessReadiness.mockReturnValue({
      canStartProcess: true,
      isProfileComplete: true,
      missing: [],
      isLoading: false,
      refreshReadiness: mockRefreshReadiness,
    });

    useTieSteps.mockReturnValue({
      steps: createTieSteps(2),
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 1,
        steps: [
          {
            stepId: 1,
            status: 'not_started',
            requirements: {
              Passport: {completed: false},
            },
          },
          {
            stepId: 2,
            status: 'not_started',
            requirements: {},
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });
  });

  it('allows browsing future steps without enabling completion or interaction', async () => {
    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    act(() => {
      getHookState().onStepPress(2);
    });

    expect(getHookState().currentStepId).toBe(2);
    expect(getHookState().canCompleteStep).toBe(false);
    expect(getHookState().canInteractWithRequirements).toBe(false);
    expect(getHookState().stepActionDisabledHint).toBe(
      'Complete the previous step before marking this one done.',
    );
    expect(getHookState().stepActionLabel).toBeDefined();
  });

  it('enables completion on step 1 when all items are checked', async () => {
    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 1,
        steps: [
          {
            stepId: 1,
            status: 'in_progress',
            requirements: {
              passport: {completed: true, source: {type: 'self_declared'}},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    expect(getHookState().canCompleteStep).toBe(true);
    expect(getHookState().stepActionDisabledHint).toBeUndefined();
  });

  it('shows completed requirements even when prerequisites are incomplete', async () => {
    mockUseProcessReadiness.mockReturnValue({
      canStartProcess: false,
      isProfileComplete: false,
      missing: ['personalInformation', 'legalPrivacy', 'payment'],
      isLoading: false,
      refreshReadiness: mockRefreshReadiness,
    });
    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 1,
        steps: [
          {
            stepId: 1,
            status: 'in_progress',
            requirements: {
              passport: {completed: true, source: {type: 'self_declared'}},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    expect(getHookState().currentStepRequirements[0]?.progress.completed).toBe(
      true,
    );
  });

  it('reconciles progress when empadronamiento profile sync fails', async () => {
    const refreshProgress = jest.fn();
    const {getProfile} = jest.requireMock(
      '@/features/profile/services/profileService',
    ) as {
      getProfile: jest.Mock;
    };
    const {saveUserProgress} = jest.requireMock(
      '@/features/dashboard/services/progressService',
    ) as {
      saveUserProgress: jest.Mock;
    };

    getProfile.mockRejectedValueOnce(new Error('Network error'));

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 1,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {
              passport: {completed: false},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress,
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    await renderDashboardScreen(navigation);
    await flushAsyncEffects();

    expect(saveUserProgress).toHaveBeenCalled();
    expect(refreshProgress).toHaveBeenCalled();
  });

  it('shows prerequisites dialog when not ready', async () => {
    // Set mock before rendering hook
    mockUseProcessReadiness.mockReturnValue({
      canStartProcess: false,
      isProfileComplete: false,
      missing: ['personalInformation', 'legalPrivacy', 'payment'],
      isLoading: false,
      refreshReadiness: mockRefreshReadiness,
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    expect(getHookState().canStartProcess).toBe(false);
    expect(getHookState().canInteractWithRequirements).toBe(false);
    expect(getHookState().readinessMissing).toEqual([
      'personalInformation',
      'legalPrivacy',
      'payment',
    ]);
    expect(getHookState().stepActionLabel).toBe('See prerequisites');
    expect(getHookState().showPrerequisitesDialog).toBe(false);

    act(() => {
      getHookState().onCompleteStep();
    });

    expect(getHookState().showPrerequisitesDialog).toBe(true);
    expect(mockRefreshReadiness).toHaveBeenCalledTimes(1);
    expect(completeStep).not.toHaveBeenCalled();

    act(() => {
      getHookState().onClosePrerequisitesDialog();
    });

    expect(getHookState().showPrerequisitesDialog).toBe(false);

    // Restore default mock for other tests
    mockUseProcessReadiness.mockReturnValue({
      canStartProcess: true,
      isProfileComplete: true,
      missing: [],
      isLoading: false,
      refreshReadiness: mockRefreshReadiness,
    });
  });

  it('shows fresh progress and prerequisites button when logged out', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });
    mockUseProcessReadiness.mockReturnValue({
      canStartProcess: false,
      isProfileComplete: false,
      missing: ['personalInformation', 'legalPrivacy', 'payment'],
      isLoading: false,
      refreshReadiness: mockRefreshReadiness,
    });
    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 2,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {},
          },
          {
            stepId: 2,
            status: 'in_progress',
            requirements: {},
          },
        ],
      }),
      isLoading: false,
      error: null,
      refreshProgress: jest.fn(),
      startStep: jest.fn(),
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    expect(getHookState().isAuthenticated).toBe(false);
    expect(getHookState().completedStepIds).toEqual([]);
    expect(getHookState().currentStepId).toBe(1);
    expect(getHookState().stepActionLabel).toBe('See prerequisites');
    expect(getHookState().canInteractWithRequirements).toBe(false);
    expect(getHookState().canCompleteStep).toBe(false);
  });

  it('navigates to step detail and booking assistant webview', async () => {
    const translateTieSteps = createTieStepsTranslator(i18n);
    const realSteps = buildTieSteps(translateTieSteps);

    useTieSteps.mockReturnValue({
      steps: realSteps,
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 1,
        steps: [
          {
            stepId: 1,
            status: 'in_progress',
            requirements: {
              'passport-nie': {completed: true, source: {type: 'self_declared'}},
              'proof-of-residence': {completed: true, source: {type: 'self_declared'}},
              'appointment-confirmation': {completed: false},
              'attend-ayuntamiento': {completed: false},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    act(() => {
      getHookState().onStepDetailPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('StepDetail', {
      stepId: 1,
    });

    await act(async () => {
      await getHookState().onBookingAssistantPress(
        'empadronamiento',
        'appointment-confirmation',
      );
    });
    await flushAsyncEffects();

    expect(navigation.navigate).toHaveBeenCalledWith('WebsiteWebView', {
      bookingAssistant: 'empadronamiento',
    });
  });

  it('shows approve and download disabled until the EX-17 form is reviewed', async () => {
    const translateTieSteps = createTieStepsTranslator(i18n);
    const realSteps = buildTieSteps(translateTieSteps);

    useTieSteps.mockReturnValue({
      steps: realSteps,
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 2,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {},
          },
          {
            stepId: 2,
            status: 'in_progress',
            requirements: {
              'ex-17-form': {completed: false},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    act(() => {
      getHookState().onStepPress(2);
    });

    const ex17Requirement = getHookState().currentStepRequirements.find(
      requirement => requirement.key === 'ex-17-form',
    );

    expect(ex17Requirement?.showApproveDownload).toBe(true);
    expect(ex17Requirement?.canApproveDownload).toBe(false);
  });

  it('enables approve and download after reviewing the EX-17 form without confirming immediately', async () => {
    const translateTieSteps = createTieStepsTranslator(i18n);
    const realSteps = buildTieSteps(translateTieSteps);

    useTieSteps.mockReturnValue({
      steps: realSteps,
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 2,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {},
          },
          {
            stepId: 2,
            status: 'in_progress',
            requirements: {
              'ex-17-form': {completed: false},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    act(() => {
      getHookState().onStepPress(2);
    });

    await act(async () => {
      await getHookState().onFormPress('ex-17', 'ex-17-form');
    });
    await flushAsyncEffects();

    expect(mockSaveEx17Pdf).toHaveBeenCalled();
    expect(mockOpenGeneratedPdf).toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith(
      'Form reviewed',
      'If everything looks correct, approve and download the form. If something is wrong, update your profile and review the form again.',
      [{text: 'Got it'}],
    );
    const ex17Requirement = getHookState().currentStepRequirements.find(
      requirement => requirement.key === 'ex-17-form',
    );

    expect(ex17Requirement?.showApproveDownload).toBe(true);
    expect(ex17Requirement?.canApproveDownload).toBe(true);
  });

  it('does not show next-steps guidance when re-viewing an approved EX-17 form', async () => {
    const translateTieSteps = createTieStepsTranslator(i18n);
    const realSteps = buildTieSteps(translateTieSteps);

    useTieSteps.mockReturnValue({
      steps: realSteps,
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 2,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {},
          },
          {
            stepId: 2,
            status: 'in_progress',
            requirements: {
              'ex-17-form': {
                completed: true,
                source: {
                  type: 'form',
                  formId: 'ex-17',
                  confirmedAt: '2026-01-01',
                },
              },
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    act(() => {
      getHookState().onStepPress(2);
    });

    mockShowAlert.mockClear();

    await act(async () => {
      await getHookState().onFormView('ex-17', 'ex-17-form');
    });
    await flushAsyncEffects();

    expect(mockOpenGeneratedPdf).toHaveBeenCalled();
    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  it('downloads and completes the EX-17 requirement after approval', async () => {
    const translateTieSteps = createTieStepsTranslator(i18n);
    const realSteps = buildTieSteps(translateTieSteps);

    useTieSteps.mockReturnValue({
      steps: realSteps,
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 2,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {},
          },
          {
            stepId: 2,
            status: 'in_progress',
            requirements: {
              'ex-17-form': {completed: false},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    act(() => {
      getHookState().onStepPress(2);
    });

    await act(async () => {
      await getHookState().onFormPress('ex-17', 'ex-17-form');
    });
    await flushAsyncEffects();

    await act(async () => {
      await getHookState().onApproveAndDownloadForm('ex-17', 'ex-17-form');
    });
    await flushAsyncEffects();

    expect(mockSaveEx17Pdf).toHaveBeenCalledTimes(2);
    expect(mockDownloadEx17PdfToDevice).toHaveBeenCalled();
    expect(completeFormRequirement).toHaveBeenCalledWith(
      2,
      'ex-17-form',
      'ex-17',
    );
    expect(mockShowToast).toHaveBeenCalledWith('Form saved to your device');
  });

  it('shows a cancelled toast when EX-17 download is dismissed', async () => {
    const {PdfDownloadDismissedError} = jest.requireMock(
      '@/features/pdfGeneration/forms/ex17/ex17PdfService',
    ) as {PdfDownloadDismissedError: new () => Error};

    mockDownloadEx17PdfToDevice.mockRejectedValue(
      new PdfDownloadDismissedError(),
    );

    const translateTieSteps = createTieStepsTranslator(i18n);
    const realSteps = buildTieSteps(translateTieSteps);

    useTieSteps.mockReturnValue({
      steps: realSteps,
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 2,
        steps: [
          {
            stepId: 1,
            status: 'completed',
            requirements: {},
          },
          {
            stepId: 2,
            status: 'in_progress',
            requirements: {
              'ex-17-form': {completed: false},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    act(() => {
      getHookState().onStepPress(2);
    });

    await act(async () => {
      await getHookState().onFormPress('ex-17', 'ex-17-form');
    });
    await flushAsyncEffects();

    await act(async () => {
      await getHookState().onApproveAndDownloadForm('ex-17', 'ex-17-form');
    });
    await flushAsyncEffects();

    expect(completeFormRequirement).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('Download cancelled');
  });

  it('shows a dependency hint when booking assistant prerequisites are incomplete', async () => {
    const translateTieSteps = createTieStepsTranslator(i18n);
    const realSteps = buildTieSteps(translateTieSteps);

    useTieSteps.mockReturnValue({
      steps: realSteps,
      isLoading: false,
      error: null,
    });

    useUserProgress.mockReturnValue({
      progress: createUserProgress({
        currentStepId: 1,
        steps: [
          {
            stepId: 1,
            status: 'in_progress',
            requirements: {
              'passport-nie': {completed: false},
              'proof-of-residence': {completed: false},
              'appointment-confirmation': {completed: false},
              'attend-ayuntamiento': {completed: false},
            },
          },
        ],
      }),
      isLoading: false,
      error: null,
      completeStep,
      toggleSelfDeclaredRequirement,
      completeBookingAssistantRequirement,
      clearBookingAssistantRequirement,
      completeFormRequirement,
      refreshProgress: jest.fn(),
    });

    const navigation = createMockNavigation() as Parameters<
      typeof useDashboardScreen
    >[0];
    const getHookState = await renderDashboardScreen(navigation);

    await act(async () => {
      await getHookState().onBookingAssistantPress(
        'empadronamiento',
        'appointment-confirmation',
      );
    });
    await flushAsyncEffects();

    expect(mockShowToast).toHaveBeenCalledWith('Complete the items above first.');
    expect(navigation.navigate).not.toHaveBeenCalledWith(
      'WebsiteWebView',
      expect.anything(),
    );
  });

});
