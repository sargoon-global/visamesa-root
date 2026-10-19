import type {TFunction} from 'i18next';

import type {RequirementWithProgress} from '@/features/dashboard/components/RequirementsChecklist';

export type FormReviewPending = {
  requirementKey: string;
  formId: string;
  stepId?: number;
};

export type FormReviewLoadingState = {
  formReviewLoading: boolean;
  formDownloadLoading: boolean;
};

export function enrichShareableFormRequirement(
  requirement: RequirementWithProgress,
  formId: string,
  pending: FormReviewPending | null,
  currentStepId: number | undefined,
  loading: FormReviewLoadingState,
): RequirementWithProgress {
  if (requirement.formId !== formId) {
    return requirement;
  }

  const isPendingForStep =
    pending?.requirementKey === requirement.key &&
    pending?.formId === formId &&
    (pending.stepId === undefined ||
      currentStepId === undefined ||
      pending.stepId === currentStepId);

  return {
    ...requirement,
    showApproveDownload: !requirement.progress.completed,
    canApproveDownload: isPendingForStep,
    formReviewLoading: loading.formReviewLoading,
    formDownloadLoading: loading.formDownloadLoading,
  };
}

export function showFormReviewNextStepsAlert(
  showAlert: (
    title: string,
    message: string,
    buttons: {text: string}[],
  ) => void,
  tDashboard: TFunction<'dashboard'>,
  tCommon: TFunction<'common'>,
) {
  showAlert(
    tDashboard('formReviewNextStepsTitle'),
    tDashboard('formReviewNextStepsMessage'),
    [{text: tCommon('actions.gotIt')}],
  );
}
