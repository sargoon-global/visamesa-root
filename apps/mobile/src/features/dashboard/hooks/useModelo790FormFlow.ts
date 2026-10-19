import {useCallback, useEffect, useState} from 'react';
import {TFunction} from 'i18next';
import {CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useAppDialog} from '@/contexts/AppDialogContext';
import {useToast} from '@/components/Toast/ToastProvider';
import {RequirementWithProgress} from '@/features/dashboard/components/RequirementsChecklist';
import {
  enrichShareableFormRequirement,
  showFormReviewNextStepsAlert,
  type FormReviewPending,
} from '@/features/dashboard/hooks/shared/formReviewFlowHelpers';
import {subscribeToProgressReset} from '@/features/dashboard/services/progressService';
import {TieStepDetail} from '@/features/home/types/TieStepDetail';
import {
  ProgressContext,
  UserProgress,
} from '@/features/dashboard/types/UserProgress';
import {getRequirementToggleState} from '@/features/dashboard/utils/requirementDependencies';
import {MODELO790_FORM_ID} from '@/features/pdfGeneration/forms/modelo790/modelo790Constants';
import {
  clearModelo790LocalSession,
  loadModelo790CompletedFile,
  loadModelo790PendingReview,
  loadModelo790ReviewFile,
  saveModelo790CompletedFile,
  setModelo790PendingReview,
} from '@/features/pdfGeneration/forms/modelo790/modelo790Storage';
import {
  downloadGeneratedPdfToDevice,
  openGeneratedPdf,
  PdfDownloadDismissedError,
  shareGeneratedPdf,
} from '@/features/pdfGeneration/services/pdfFileService';
import {
  DashboardStackParamList,
  RootStackParamList,
} from '@/navigation/types';

type DashboardScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type UseModelo790FormFlowOptions = {
  navigation: DashboardScreenNavigation;
  currentStep: TieStepDetail | undefined;
  currentStepId: number;
  progress: UserProgress | null;
  canInteractWithRequirements: boolean;
  progressContext: ProgressContext;
  steps: TieStepDetail[];
  isAuthenticated: boolean;
  tDashboard: TFunction<'dashboard'>;
  tCommon: TFunction<'common'>;
  completeFormRequirement: (
    stepId: number,
    requirementKey: string,
    formId: string,
  ) => Promise<void>;
};

export function useModelo790FormFlow({
  navigation,
  currentStep,
  currentStepId,
  progress,
  canInteractWithRequirements,
  progressContext,
  steps,
  isAuthenticated,
  tDashboard,
  tCommon,
  completeFormRequirement,
}: UseModelo790FormFlowOptions) {
  const {showToast} = useToast();
  const {showAlert} = useAppDialog();
  const [pendingModelo790Review, setPendingModelo790Review] =
    useState<FormReviewPending | null>(null);
  const [isModelo790FormLoading, setIsModelo790FormLoading] = useState(false);
  const [isModelo790DownloadLoading, setIsModelo790DownloadLoading] =
    useState(false);

  const syncPendingFromStorage = useCallback(
    async (options: {allowNextStepsAlert: boolean}) => {
      const stored = await loadModelo790PendingReview();
      if (
        !stored ||
        (currentStep && stored.stepId !== currentStep.id)
      ) {
        if (stored && currentStep && stored.stepId !== currentStep.id) {
          await setModelo790PendingReview(null);
        }
        setPendingModelo790Review(null);
        return;
      }

      setPendingModelo790Review({
        requirementKey: stored.requirementKey,
        formId: stored.formId,
        stepId: stored.stepId,
      });

      if (options.allowNextStepsAlert && stored.showNextStepsAlert) {
        await setModelo790PendingReview({
          ...stored,
          showNextStepsAlert: false,
        });
        showFormReviewNextStepsAlert(showAlert, tDashboard, tCommon);
      }
    },
    [currentStep, showAlert, tCommon, tDashboard],
  );

  useEffect(() => {
    setPendingModelo790Review(null);
  }, [currentStepId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingModelo790Review(null);
      clearModelo790LocalSession().catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return subscribeToProgressReset(() => {
      setPendingModelo790Review(null);
      clearModelo790LocalSession().catch(() => {});
    });
  }, []);

  useEffect(() => {
    syncPendingFromStorage({allowNextStepsAlert: false}).catch(() => {});
  }, [currentStepId, syncPendingFromStorage]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsModelo790FormLoading(false);
      syncPendingFromStorage({allowNextStepsAlert: true}).catch(() => {});
    });
    return unsubscribe;
  }, [navigation, syncPendingFromStorage]);

  const enrichRequirements = useCallback(
    (requirements: RequirementWithProgress[]): RequirementWithProgress[] =>
      requirements.map(requirement =>
        enrichShareableFormRequirement(
          requirement,
          MODELO790_FORM_ID,
          pendingModelo790Review,
          currentStep?.id,
          {
            formReviewLoading: isModelo790FormLoading,
            formDownloadLoading: isModelo790DownloadLoading,
          },
        ),
      ),
    [
      currentStep?.id,
      isModelo790DownloadLoading,
      isModelo790FormLoading,
      pendingModelo790Review,
    ],
  );

  const onFormPress = useCallback(
    async (formId: string, requirementKey: string) => {
      if (
        formId !== MODELO790_FORM_ID ||
        !currentStep ||
        !progress ||
        !canInteractWithRequirements ||
        isModelo790FormLoading ||
        isModelo790DownloadLoading
      ) {
        return;
      }

      setIsModelo790FormLoading(true);
      navigation.navigate('WebsiteWebView', {
        automation: 'modelo-790-012',
        modelo790Review: {
          stepId: currentStep.id,
          requirementKey,
          formId,
        },
      });
    },
    [
      canInteractWithRequirements,
      currentStep,
      isModelo790DownloadLoading,
      isModelo790FormLoading,
      navigation,
      progress,
    ],
  );

  const openStoredModelo790Pdf = useCallback(async () => {
    const completed = await loadModelo790CompletedFile();
    const file = completed ?? (await loadModelo790ReviewFile());
    if (!file) {
      throw new Error('MODEL790_PDF_MISSING');
    }

    try {
      await openGeneratedPdf(file);
    } catch {
      await shareGeneratedPdf(file);
    }
  }, []);

  const onFormView = useCallback(
    async (formId: string, requirementKey: string) => {
      if (formId !== MODELO790_FORM_ID || !currentStep || !progress) {
        return;
      }

      const requirementProgress = progress.steps.find(
        step => step.stepId === currentStep.id,
      )?.requirements[requirementKey];

      if (!requirementProgress?.completed) {
        showToast(tDashboard('documentViewDisabledHint'));
        return;
      }

      setIsModelo790FormLoading(true);
      try {
        await openStoredModelo790Pdf();
      } catch (error) {
        if (error instanceof Error && error.message === 'MODEL790_PDF_MISSING') {
          showAlert(
            tDashboard('modelo790FormViewMissingTitle'),
            tDashboard('modelo790FormViewMissingMessage'),
            [{text: tCommon('actions.gotIt')}],
          );
          return;
        }
        showAlert(tCommon('errors.title'), tCommon('errors.generic'));
      } finally {
        setIsModelo790FormLoading(false);
      }
    },
    [
      currentStep,
      openStoredModelo790Pdf,
      progress,
      showAlert,
      showToast,
      tCommon,
      tDashboard,
    ],
  );

  const onApproveAndDownloadForm = useCallback(
    async (formId: string, requirementKey: string) => {
      if (
        !currentStep ||
        !progress ||
        !canInteractWithRequirements ||
        !pendingModelo790Review
      ) {
        return;
      }

      if (
        pendingModelo790Review.requirementKey !== requirementKey ||
        pendingModelo790Review.formId !== formId ||
        pendingModelo790Review.stepId !== currentStep.id
      ) {
        return;
      }

      const toggleState = getRequirementToggleState(
        progress,
        currentStep,
        requirementKey,
        progressContext,
        steps,
      );

      if (!toggleState.canUseActions) {
        showToast(tDashboard('requirementDependencyHint'));
        return;
      }

      if (isModelo790DownloadLoading || isModelo790FormLoading) {
        return;
      }

      setIsModelo790DownloadLoading(true);

      try {
        const file = await loadModelo790ReviewFile();
        if (!file) {
          throw new Error('MODEL790_PDF_MISSING');
        }

        await downloadGeneratedPdfToDevice(file);
        await saveModelo790CompletedFile(file);
        await completeFormRequirement(currentStep.id, requirementKey, formId);
        await setModelo790PendingReview(null);
        setPendingModelo790Review(null);
        showToast(tDashboard('formDownloaded'));
      } catch (downloadError) {
        if (downloadError instanceof PdfDownloadDismissedError) {
          showToast(tDashboard('formDownloadCancelled'));
          return;
        }
        if (
          downloadError instanceof Error &&
          downloadError.message === 'MODEL790_PDF_MISSING'
        ) {
          showAlert(
            tDashboard('modelo790FormViewMissingTitle'),
            tDashboard('modelo790FormViewMissingMessage'),
            [{text: tCommon('actions.gotIt')}],
          );
          return;
        }

        showAlert(tCommon('errors.title'), tCommon('errors.generic'));
      } finally {
        setIsModelo790DownloadLoading(false);
      }
    },
    [
      canInteractWithRequirements,
      completeFormRequirement,
      currentStep,
      isModelo790DownloadLoading,
      isModelo790FormLoading,
      pendingModelo790Review,
      progress,
      progressContext,
      showAlert,
      showToast,
      steps,
      tCommon,
      tDashboard,
    ],
  );

  return {
    enrichRequirements,
    onFormPress,
    onFormView,
    onApproveAndDownloadForm,
  };
}
