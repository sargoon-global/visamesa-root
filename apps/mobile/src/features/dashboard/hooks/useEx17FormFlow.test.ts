import {act} from 'react';
import {TFunction} from 'i18next';
import {buildTieSteps, createTieStepsTranslator} from '@visamesa/content/tieSteps/detail';
import {i18n} from '@visamesa/content/i18n';

import {RequirementWithProgress} from '@/features/dashboard/components/RequirementsChecklist';
import {useEx17FormFlow} from '@/features/dashboard/hooks/useEx17FormFlow';
import {EX17_FORM_ID} from '@/features/pdfGeneration/forms/ex17/ex17Constants';
import {createUserProgress} from '@/test/fixtures/userProgress';
import {flushAsyncEffects, renderHook, rerenderRenderedHook, unmountRenderedHook} from '@/test/renderHook';

const mockShowToast = jest.fn();
const mockShowAlert = jest.fn();
const mockSaveEx17Pdf = jest.fn();
const mockOpenGeneratedPdf = jest.fn();
const mockShareGeneratedPdf = jest.fn();
const mockDownloadEx17PdfToDevice = jest.fn();
const mockCompleteFormRequirement = jest.fn();
const mockGetProfile = jest.fn();

jest.mock('@/components/Toast/ToastProvider', () => ({
  useToast: () => ({showToast: mockShowToast}),
}));

jest.mock('@/contexts/AppDialogContext', () => ({
  useAppDialog: () => ({showAlert: mockShowAlert}),
  AppDialogProvider: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('@/features/profile/services/profileService', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
}));

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

const generatedFile = {
  fileName: 'ex17-tie-test.pdf',
  path: '/tmp/ex17-tie-test.pdf',
  uri: 'file:///tmp/ex17-tie-test.pdf',
};

const ex17Requirement: RequirementWithProgress = {
  key: 'ex-17-form',
  label: 'EX-17 application form',
  type: 'form',
  location: 'in_app',
  formId: EX17_FORM_ID,
  shareableForm: true,
  progress: {completed: false},
};

type HookOptions = Parameters<typeof useEx17FormFlow>[0];

function createHookOptions(overrides: Partial<HookOptions> = {}): HookOptions {
  const translateTieSteps = createTieStepsTranslator(i18n);
  const steps = buildTieSteps(translateTieSteps);
  const currentStep = steps.find(step => step.id === 2);
  const progress = createUserProgress({
    currentStepId: 2,
    steps: [
      {stepId: 1, status: 'completed', requirements: {}},
      {
        stepId: 2,
        status: 'in_progress',
        requirements: {'ex-17-form': {completed: false}},
      },
    ],
  });

  return {
    currentStep,
    currentStepId: 2,
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

describe('useEx17FormFlow', () => {
  let hookOptions: HookOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    hookOptions = createHookOptions();
    mockGetProfile.mockResolvedValue({personal: {firstName: 'Juan'}});
    mockSaveEx17Pdf.mockResolvedValue(generatedFile);
    mockOpenGeneratedPdf.mockResolvedValue(undefined);
    mockShareGeneratedPdf.mockResolvedValue(undefined);
    mockDownloadEx17PdfToDevice.mockResolvedValue(undefined);
    mockCompleteFormRequirement.mockResolvedValue(undefined);
  });

  afterEach(() => {
    unmountRenderedHook();
  });

  it('marks approve and download as pending after review', async () => {
    const getState = renderHook(() => useEx17FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormPress(EX17_FORM_ID, 'ex-17-form');
    });

    const [requirement] = getState().enrichRequirements([ex17Requirement]);
    expect(requirement.canApproveDownload).toBe(true);
    expect(requirement.showApproveDownload).toBe(true);
    expect(mockShowAlert).toHaveBeenCalled();
  });

  it('clears pending review when the current step changes', async () => {
    const getState = renderHook(() => useEx17FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormPress(EX17_FORM_ID, 'ex-17-form');
    });

    hookOptions = createHookOptions({currentStepId: 3});
    rerenderRenderedHook();

    const [requirement] = getState().enrichRequirements([ex17Requirement]);
    expect(requirement.canApproveDownload).toBe(false);
  });

  it('clears pending review when the user is no longer authenticated', async () => {
    const getState = renderHook(() => useEx17FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormPress(EX17_FORM_ID, 'ex-17-form');
    });

    hookOptions = createHookOptions({isAuthenticated: false});
    rerenderRenderedHook();

    const [requirement] = getState().enrichRequirements([ex17Requirement]);
    expect(requirement.canApproveDownload).toBe(false);
  });

  it('shows a toast when viewing an unapproved EX-17 form', async () => {
    const getState = renderHook(() => useEx17FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormView(EX17_FORM_ID, 'ex-17-form');
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      i18n.t('documentViewDisabledHint', {ns: 'dashboard'}),
    );
    expect(mockSaveEx17Pdf).not.toHaveBeenCalled();
  });

  it('falls back to sharing when opening the PDF preview fails', async () => {
    mockOpenGeneratedPdf.mockRejectedValueOnce(new Error('Preview unavailable'));
    const getState = renderHook(() => useEx17FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormPress(EX17_FORM_ID, 'ex-17-form');
    });

    expect(mockShareGeneratedPdf).toHaveBeenCalledWith(generatedFile);
    expect(getState().enrichRequirements([ex17Requirement])[0].canApproveDownload).toBe(
      true,
    );
  });

  it('blocks approve and download when requirement dependencies are incomplete', async () => {
    const translateTieSteps = createTieStepsTranslator(i18n);
    const steps = buildTieSteps(translateTieSteps);
    const baseStep = steps.find(step => step.id === 3)!;
    const currentStep = {
      ...baseStep,
      requirements: [
        {key: 'passport-nie', label: 'Passport and NIE', type: 'self_declared' as const, location: 'in_app' as const},
        {
          key: 'ex-17-form',
          label: 'EX-17 application form',
          type: 'form' as const,
          location: 'in_app' as const,
          formId: EX17_FORM_ID,
          shareableForm: true,
          dependsOnKeys: ['passport-nie'],
        },
      ],
    };
    hookOptions = createHookOptions({
      currentStep,
      currentStepId: 3,
      progress: createUserProgress({
        currentStepId: 3,
        steps: [
          {stepId: 1, status: 'completed', requirements: {}},
          {stepId: 2, status: 'completed', requirements: {}},
          {
            stepId: 3,
            status: 'in_progress',
            requirements: {
              'passport-nie': {completed: false},
              'ex-17-form': {completed: false},
            },
          },
        ],
      }),
      canInteractWithRequirements: true,
      steps,
    });

    const getState = renderHook(() => useEx17FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormPress(EX17_FORM_ID, 'ex-17-form');
    });
    await act(async () => {
      await getState().onApproveAndDownloadForm(EX17_FORM_ID, 'ex-17-form');
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      i18n.t('requirementDependencyHint', {ns: 'dashboard'}),
    );
    expect(mockCompleteFormRequirement).not.toHaveBeenCalled();
  });

  it('regenerates the PDF before approving and downloading', async () => {
    const getState = renderHook(() => useEx17FormFlow(hookOptions));

    await act(async () => {
      await getState().onFormPress(EX17_FORM_ID, 'ex-17-form');
    });
    await act(async () => {
      await getState().onApproveAndDownloadForm(EX17_FORM_ID, 'ex-17-form');
    });

    expect(mockSaveEx17Pdf).toHaveBeenCalledTimes(2);
    expect(mockDownloadEx17PdfToDevice).toHaveBeenCalledWith(generatedFile);
    expect(mockCompleteFormRequirement).toHaveBeenCalledWith(
      2,
      'ex-17-form',
      EX17_FORM_ID,
    );
  });
});
