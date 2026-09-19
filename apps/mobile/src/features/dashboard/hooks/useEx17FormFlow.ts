import {useCallback, useEffect, useState} from 'react';
import {TFunction} from 'i18next';

import {useAppDialog} from '@/contexts/AppDialogContext';
import {useToast} from '@/components/Toast/ToastProvider';
import {RequirementWithProgress} from '@/features/dashboard/components/RequirementsChecklist';
import {TieStepDetail} from '@/features/home/types/TieStepDetail';
import {
  ProgressContext,
  UserProgress,
} from '@/features/dashboard/types/UserProgress';
import {getRequirementToggleState} from '@/features/dashboard/utils/requirementDependencies';
import {EX17_FORM_ID} from '@/features/pdfGeneration/forms/ex17/ex17Constants';
import {
  downloadEx17PdfToDevice,
  openGeneratedPdf,
  PdfDownloadDismissedError,
  saveEx17Pdf,
  shareGeneratedPdf,
} from '@/features/pdfGeneration/forms/ex17/ex17PdfService';
import {mapProfileToEx17Data} from '@/features/pdfGeneration/forms/ex17/mapProfileToEx17Data';
import {getProfile} from '@/features/profile/services/profileService';

type PendingEx17Review = {
  requirementKey: string;
  formId: string;
};

type UseEx17FormFlowOptions = {
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

export function useEx17FormFlow({
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
}: UseEx17FormFlowOptions) {
  const {showToast} = useToast();
  const {showAlert} = useAppDialog();
  const [pendingEx17Review, setPendingEx17Review] =
    useState<PendingEx17Review | null>(null);
  const [isEx17FormLoading, setIsEx17FormLoading] = useState(false);
  const [isEx17DownloadLoading, setIsEx17DownloadLoading] = useState(false);

  useEffect(() => {
    setPendingEx17Review(null);
  }, [currentStepId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingEx17Review(null);
    }
  }, [isAuthenticated]);

  const enrichRequirements = useCallback(
    (requirements: RequirementWithProgress[]): RequirementWithProgress[] =>
      requirements.map(requirement => {
        if (requirement.formId !== EX17_FORM_ID) {
          return requirement;
        }

        const isPendingEx17 =
          pendingEx17Review?.requirementKey === requirement.key;

        return {
          ...requirement,
          showApproveDownload: !requirement.progress.completed,
          canApproveDownload: isPendingEx17,
          formReviewLoading: isEx17FormLoading,
          formDownloadLoading: isEx17DownloadLoading,
        };
      }),
    [
      isEx17DownloadLoading,
      isEx17FormLoading,
      pendingEx17Review?.requirementKey,
    ],
  );

  const previewEx17Form = useCallback(
    async (
      requirementKey: string,
      formId: string,
      options: {trackReview: boolean},
    ) => {
      if (isEx17FormLoading || isEx17DownloadLoading) {
        return;
      }

      setIsEx17FormLoading(true);

      try {
        const profileData = await getProfile();
        const generatedFile = await saveEx17Pdf(
          mapProfileToEx17Data(profileData),
        );
        try {
          await openGeneratedPdf(generatedFile);
        } catch {
          await shareGeneratedPdf(generatedFile);
        }

        if (options.trackReview) {
          setPendingEx17Review({requirementKey, formId});
          showAlert(
            tDashboard('ex17ReviewNextStepsTitle'),
            tDashboard('ex17ReviewNextStepsMessage'),
            [{text: tCommon('actions.gotIt')}],
          );
        }
      } catch (formError) {
        showAlert(
          tCommon('errors.title'),
          formError instanceof Error
            ? formError.message
            : tCommon('errors.generic'),
        );
      } finally {
        setIsEx17FormLoading(false);
      }
    },
    [
      isEx17DownloadLoading,
      isEx17FormLoading,
      showAlert,
      tCommon,
      tDashboard,
    ],
  );

  const onFormPress = useCallback(
    async (formId: string, requirementKey: string) => {
      if (
        formId !== EX17_FORM_ID ||
        !currentStep ||
        !progress ||
        !canInteractWithRequirements
      ) {
        return;
      }

      await previewEx17Form(requirementKey, formId, {trackReview: true});
    },
    [canInteractWithRequirements, currentStep, previewEx17Form, progress],
  );

  const onFormView = useCallback(
    async (formId: string, requirementKey: string) => {
      if (formId !== EX17_FORM_ID || !currentStep || !progress) {
        return;
      }

      const requirementProgress = progress.steps.find(
        step => step.stepId === currentStep.id,
      )?.requirements[requirementKey];

      if (!requirementProgress?.completed) {
        showToast(tDashboard('documentViewDisabledHint'));
        return;
      }

      await previewEx17Form(requirementKey, formId, {trackReview: false});
    },
    [currentStep, previewEx17Form, progress, showToast, tDashboard],
  );

  const onApproveAndDownloadForm = useCallback(
    async (formId: string, requirementKey: string) => {
      if (
        !currentStep ||
        !progress ||
        !canInteractWithRequirements ||
        !pendingEx17Review
      ) {
        return;
      }

      if (
        pendingEx17Review.requirementKey !== requirementKey ||
        pendingEx17Review.formId !== formId
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

      if (isEx17DownloadLoading || isEx17FormLoading) {
        return;
      }

      setIsEx17DownloadLoading(true);

      try {
        const profileData = await getProfile();
        const generatedFile = await saveEx17Pdf(
          mapProfileToEx17Data(profileData),
        );
        await downloadEx17PdfToDevice(generatedFile);
        await completeFormRequirement(currentStep.id, requirementKey, formId);
        setPendingEx17Review(null);
        showToast(tDashboard('formDownloaded'));
      } catch (downloadError) {
        if (downloadError instanceof PdfDownloadDismissedError) {
          showToast(tDashboard('formDownloadCancelled'));
          return;
        }

        showAlert(
          tCommon('errors.title'),
          downloadError instanceof Error
            ? downloadError.message
            : tCommon('errors.generic'),
        );
      } finally {
        setIsEx17DownloadLoading(false);
      }
    },
    [
      canInteractWithRequirements,
      completeFormRequirement,
      currentStep,
      isEx17DownloadLoading,
      isEx17FormLoading,
      pendingEx17Review,
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
