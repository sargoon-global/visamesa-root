import {act} from 'react';
import {TFunction} from 'i18next';
import {buildTieSteps, createTieStepsTranslator} from '@visamesa/content/tieSteps/detail';
import {i18n} from '@visamesa/content/i18n';

import {RequirementWithProgress} from '@/features/dashboard/components/RequirementsChecklist';
import {useModelo790FormFlow} from '@/features/dashboard/hooks/useModelo790FormFlow';
import {MODELO790_FORM_ID} from '@/features/pdfGeneration/forms/modelo790/modelo790Constants';
import {createUserProgress} from '@/test/fixtures/userProgress';
import {createMockNavigation} from '@/test/navigation';
import {renderHook, rerenderRenderedHook, unmountRenderedHook} from '@/test/renderHook';

const mockShowToast = jest.fn();
const mockShowAlert = jest.fn();
const mockCompleteFormRequirement = jest.fn();
const mockLoadPending = jest.fn();
const mockSetPending = jest.fn();
const mockLoadReviewFile = jest.fn();
const mockLoadCompletedFile = jest.fn();
const mockSaveCompletedFile = jest.fn();
const mockClearSession = jest.fn();
const mockOpenGeneratedPdf = jest.fn();
const mockDownloadGeneratedPdf = jest.fn();

jest.mock('@/components/Toast/ToastProvider', () => ({
  useToast: () => ({showToast: mockShowToast}),
}));

jest.mock('@/contexts/AppDialogContext', () => ({
  useAppDialog: () => ({showAlert: mockShowAlert}),
  AppDialogProvider: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('@/features/pdfGeneration/forms/modelo790/modelo790Storage', () => ({
  loadModelo790PendingReview: (...args: unknown[]) => mockLoadPending(...args),
  setModelo790PendingReview: (...args: unknown[]) => mockSetPending(...args),
  loadModelo790ReviewFile: (...args: unknown[]) => mockLoadReviewFile(...args),
  loadModelo790CompletedFile: (...args: unknown[]) =>
    mockLoadCompletedFile(...args),
  saveModelo790CompletedFile: (...args: unknown[]) =>
    mockSaveCompletedFile(...args),
  clearModelo790LocalSession: (...args: unknown[]) => mockClearSession(...args),
}));

jest.mock('@/features/pdfGeneration/services/pdfFileService', () => ({
  openGeneratedPdf: (...args: unknown[]) => mockOpenGeneratedPdf(...args),
  downloadGeneratedPdfToDevice: (...args: unknown[]) =>
    mockDownloadGeneratedPdf(...args),
  shareGeneratedPdf: jest.fn(),
  PdfDownloadDismissedError: class PdfDownloadDismissedError extends Error {
    constructor() {
      super('PDF download dismissed');
      this.name = 'PdfDownloadDismissedError';
    }
  },
}));

jest.mock('@/features/dashboard/services/progressService', () => ({
  subscribeToProgressReset: jest.fn(() => () => {}),
}));

const generatedFile = {
  fileName: 'modelo-790-012-1.pdf',
  path: '/tmp/modelo.pdf',
  uri: 'file:///tmp/modelo.pdf',
};

const modeloRequirement: RequirementWithProgress = {
  key: 'modelo-790-form',
  label: 'Modelo 790',
  type: 'form',
  location: 'in_app',
  formId: MODELO790_FORM_ID,
  shareableForm: true,
  progress: {completed: false},
};

type HookOptions = Parameters<typeof useModelo790FormFlow>[0];

function createHookOptions(overrides: Partial<HookOptions> = {}): HookOptions {
  const translateTieSteps = createTieStepsTranslator(i18n);
  const steps = buildTieSteps(translateTieSteps);
  const currentStep = steps.find(step => step.id === 4);
  const progress = createUserProgress({
    currentStepId: 4,
    steps: [
      {stepId: 1, status: 'completed', requirements: {}},
      {stepId: 2, status: 'completed', requirements: {}},
      {stepId: 3, status: 'completed', requirements: {}},
      {
        stepId: 4,
        status: 'in_progress',
        requirements: {'modelo-790-form': {completed: false}},
      },
    ],
  });

  return {
    navigation: createMockNavigation() as HookOptions['navigation'],
    currentStep,
    currentStepId: 4,
    progress,
    canInteractWithRequirements: true,
    progressContext: {isProfileComplete: true, allSteps: steps},
    steps,
    isAuthenticated: true,
    tDashboard: i18n.getFixedT('en', 'dashboard') as TFunction<'dashboard'>,
    tCommon: i18n.getFixedT('en', 'common') as TFunction<'common'>,
    completeFormRequirement: mockCompleteFormRequirement,
    ...overrides,
  };
}

describe('useModelo790FormFlow', () => {
  let hookOptions: HookOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    hookOptions = createHookOptions();
    mockLoadPending.mockResolvedValue(null);
    mockSetPending.mockResolvedValue(undefined);
    mockLoadReviewFile.mockResolvedValue(generatedFile);
    mockLoadCompletedFile.mockResolvedValue(null);
    mockSaveCompletedFile.mockResolvedValue(undefined);
    mockOpenGeneratedPdf.mockResolvedValue(undefined);
    mockDownloadGeneratedPdf.mockResolvedValue(undefined);
    mockCompleteFormRequirement.mockResolvedValue(undefined);
  });

  afterEach(() => {
    unmountRenderedHook();
  });

  it('navigates to the official flow for review', async () => {
    const getState = renderHook(() => useModelo790FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormPress(MODELO790_FORM_ID, 'modelo-790-form');
    });

    expect(hookOptions.navigation.navigate).toHaveBeenCalledWith(
      'WebsiteWebView',
      expect.objectContaining({
        automation: 'modelo-790-012',
        modelo790Review: {
          stepId: 4,
          requirementKey: 'modelo-790-form',
          formId: MODELO790_FORM_ID,
        },
      }),
    );
  });

  it('marks approve as pending after stored review for the same step', async () => {
    mockLoadPending.mockResolvedValue({
      requirementKey: 'modelo-790-form',
      formId: MODELO790_FORM_ID,
      stepId: 4,
    });

    const getState = renderHook(() => useModelo790FormFlow(hookOptions));
    await act(async () => {
      await Promise.resolve();
    });
    rerenderRenderedHook();

    const enriched = getState().enrichRequirements([modeloRequirement])[0];
    expect(enriched.canApproveDownload).toBe(true);
  });

  it('approves and completes after downloading the stored review PDF', async () => {
    mockLoadPending.mockResolvedValue({
      requirementKey: 'modelo-790-form',
      formId: MODELO790_FORM_ID,
      stepId: 4,
    });

    const getState = renderHook(() => useModelo790FormFlow(hookOptions));
    await act(async () => {
      await Promise.resolve();
    });
    rerenderRenderedHook();

    await act(async () => {
      await getState().onApproveAndDownloadForm(
        MODELO790_FORM_ID,
        'modelo-790-form',
      );
    });

    expect(mockDownloadGeneratedPdf).toHaveBeenCalledWith(generatedFile);
    expect(mockCompleteFormRequirement).toHaveBeenCalledWith(
      4,
      'modelo-790-form',
      MODELO790_FORM_ID,
    );
  });
});
