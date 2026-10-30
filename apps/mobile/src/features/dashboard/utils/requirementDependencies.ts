import {FEE_PAYMENT_RECEIPT_REQUIREMENT_KEY} from '@visamesa/content/tieSteps/profileLock';

import { ASSISTED_BOOKING_REQUIREMENT_TYPE, TieStepDetail } from '@/features/home/types/TieStepDetail';
import {
  ProgressContext,
  UserProgress,
} from '@/features/dashboard/types/UserProgress';
import {getEffectiveRequirementProgress} from '@/features/dashboard/utils/progressUtils';

function isRequirementDoneInStep(
  progress: UserProgress,
  step: TieStepDetail,
  requirementKey: string,
  context: ProgressContext,
): boolean {
  return getEffectiveRequirementProgress(
    progress,
    step,
    requirementKey,
    context,
  ).completed;
}

export function getDependentsInStep(
  step: TieStepDetail,
  requirementKey: string,
): string[] {
  return step.requirements
    .filter(requirement =>
      requirement.dependsOnKeys?.includes(requirementKey),
    )
    .map(requirement => requirement.key);
}

export function areDependenciesMet(
  progress: UserProgress,
  step: TieStepDetail,
  requirementKey: string,
  context: ProgressContext,
): boolean {
  const requirement = step.requirements.find(item => item.key === requirementKey);

  if (!requirement?.dependsOnKeys?.length) {
    return true;
  }

  return requirement.dependsOnKeys.every(dependencyKey =>
    isRequirementDoneInStep(progress, step, dependencyKey, context),
  );
}

export function isBlockedByDependents(
  progress: UserProgress,
  step: TieStepDetail,
  requirementKey: string,
  context: ProgressContext,
): boolean {
  const dependents = getDependentsInStep(step, requirementKey);

  return dependents.some(dependentKey =>
    isRequirementDoneInStep(progress, step, dependentKey, context),
  );
}

export function canCheckRequirement(
  progress: UserProgress,
  step: TieStepDetail,
  requirementKey: string,
  context: ProgressContext,
): boolean {
  return areDependenciesMet(progress, step, requirementKey, context);
}

export function canUncheckRequirement(
  progress: UserProgress,
  step: TieStepDetail,
  requirementKey: string,
  context: ProgressContext,
): boolean {
  return !isBlockedByDependents(progress, step, requirementKey, context);
}

export function canShowDocumentActions(
  requirement: TieStepDetail['requirements'][number],
  progress: UserProgress,
  steps: TieStepDetail[],
  step: TieStepDetail,
): boolean {
  if (!requirement.shareableForm || !requirement.formId) {
    return false;
  }

  if (requirement.referencesRequirement) {
    const {stepId, requirementKey} = requirement.referencesRequirement;
    const sourceStep = steps.find(item => item.id === stepId);

    if (!sourceStep) {
      return false;
    }

    const stored =
      progress.steps.find(item => item.stepId === stepId)?.requirements[
        requirementKey
      ];

    return Boolean(
      stored?.completed &&
        (stored.source?.type === 'form' ||
          stored.source?.type === 'self_declared'),
    );
  }

  const stored =
    progress.steps.find(item => item.stepId === step.id)?.requirements[
      requirement.key
    ];

  return Boolean(
    stored?.completed &&
      (stored.source?.type === 'form' || stored.source?.type === 'self_declared'),
  );
}

export type RequirementToggleState = {
  canCheck: boolean;
  canUncheck: boolean;
  showDocumentActions: boolean;
  canUseActions: boolean;
};

export function getRequirementToggleState(
  progress: UserProgress,
  step: TieStepDetail,
  requirementKey: string,
  context: ProgressContext,
  steps: TieStepDetail[],
): RequirementToggleState {
  const requirement = step.requirements.find(item => item.key === requirementKey);

  if (!requirement) {
    return {
      canCheck: false,
      canUncheck: false,
      showDocumentActions: false,
      canUseActions: false,
    };
  }

  const stored =
    progress.steps.find(item => item.stepId === step.id)?.requirements[
      requirementKey
    ] ?? {completed: false};
  const isStoredDone = stored.completed;
  const dependenciesMet = areDependenciesMet(
    progress,
    step,
    requirementKey,
    context,
  );

  const receiptLocked =
    context.isPersonalDetailsLocked &&
    requirementKey === FEE_PAYMENT_RECEIPT_REQUIREMENT_KEY;

  const canUncheckStored =
    !receiptLocked &&
    isStoredDone &&
    canUncheckRequirement(progress, step, requirementKey, context) &&
    (stored.source?.type === 'self_declared' ||
      stored.source?.type === 'form' ||
      (stored.source?.type === ASSISTED_BOOKING_REQUIREMENT_TYPE &&
        !stored.source.appointment));

  const canCheckViaCheckbox =
    requirement.type === 'self_declared' &&
    !isStoredDone &&
    canCheckRequirement(progress, step, requirementKey, context);

  return {
    canCheck: canCheckViaCheckbox,
    canUncheck: canUncheckStored,
    showDocumentActions: canShowDocumentActions(
      requirement,
      progress,
      steps,
      step,
    ),
    canUseActions: dependenciesMet,
  };
}
