import {
  ASSISTED_BOOKING_REQUIREMENT_TYPE,
  TieStepDetail,
} from '@/features/home/types/TieStepDetail';
import {
  ProgressContext,
  RequirementProgress,
  StepStatus,
  UserProgress,
} from '@/features/dashboard/types/UserProgress';
import {findRequirementInSteps} from '@/features/dashboard/utils/requirementGroups';

export function getStepProgress(
  progress: UserProgress,
  stepId: number,
): UserProgress['steps'][number] | undefined {
  return progress.steps.find(step => step.stepId === stepId);
}

export function getStepStatus(
  progress: UserProgress,
  stepId: number,
): StepStatus {
  return getStepProgress(progress, stepId)?.status ?? 'not_started';
}

export function isStepCompleted(progress: UserProgress, stepId: number): boolean {
  return getStepStatus(progress, stepId) === 'completed';
}

function isRequirementCompleteInStep(
  progress: UserProgress,
  stepId: number,
  requirementKey: string,
  context: ProgressContext,
): boolean {
  const step = context.allSteps?.find(item => item.id === stepId);

  if (!step) {
    return false;
  }

  return getEffectiveRequirementProgress(
    progress,
    step,
    requirementKey,
    context,
  ).completed;
}

export function getEffectiveRequirementProgress(
  progress: UserProgress,
  step: TieStepDetail,
  requirementKey: string,
  context: ProgressContext = {},
): RequirementProgress {
  const stored =
    getStepProgress(progress, step.id)?.requirements[requirementKey];

  if (stored?.completed) {
    return stored;
  }

  const requirement = step.requirements.find(
    item => item.key === requirementKey,
  );

  if (!requirement) {
    return stored ?? {completed: false};
  }

  if (requirement.referencesProfile && context.isProfileComplete) {
    return {
      completed: true,
      source: {type: 'referenced_profile'},
    };
  }

  if (
    context.isCitaPreviaBooked &&
    requirement.type === ASSISTED_BOOKING_REQUIREMENT_TYPE &&
    requirement.bookingAssistantId === 'cita-previa'
  ) {
    return {
      completed: true,
      source: {
        type: ASSISTED_BOOKING_REQUIREMENT_TYPE,
        bookingAssistantId: 'cita-previa',
        completedAt: context.citaPreviaBookedAt ?? new Date(0).toISOString(),
      },
    };
  }

  if (requirement.referencesRequirement && context.allSteps) {
    const {stepId, requirementKey: referencedKey} =
      requirement.referencesRequirement;

    if (
      isRequirementCompleteInStep(progress, stepId, referencedKey, context)
    ) {
      return {
        completed: true,
        source: {
          type: 'referenced_requirement',
          stepId,
          requirementKey: referencedKey,
        },
      };
    }
  }

  if (requirement.referencesStepId) {
    if (isStepCompleted(progress, requirement.referencesStepId)) {
      return {
        completed: true,
        source: {
          type: 'referenced_step',
          stepId: requirement.referencesStepId,
        },
      };
    }
  }

  return stored ?? {completed: false};
}

export function areAllRequirementsComplete(
  progress: UserProgress,
  step: TieStepDetail,
  context: ProgressContext = {},
): boolean {
  return step.requirements.every(requirement =>
    getEffectiveRequirementProgress(progress, step, requirement.key, context)
      .completed,
  );
}

/**
 * Writes effective (referenced) requirement completion into stored progress so
 * synced snapshots match what the UI treats as complete.
 */
export function materializeEffectiveRequirements(
  progress: UserProgress,
  steps: TieStepDetail[],
  context: ProgressContext = {},
): UserProgress {
  const ctx: ProgressContext = {
    ...context,
    allSteps: context.allSteps ?? steps,
  };

  let changed = false;

  const newSteps = progress.steps.map(stepProgress => {
    const stepDef = steps.find(item => item.id === stepProgress.stepId);

    if (!stepDef) {
      return stepProgress;
    }

    let stepChanged = false;
    const requirements = {...stepProgress.requirements};

    for (const requirement of stepDef.requirements) {
      const stored = requirements[requirement.key];

      if (stored?.completed) {
        continue;
      }

      const effective = getEffectiveRequirementProgress(
        progress,
        stepDef,
        requirement.key,
        ctx,
      );

      if (!effective.completed) {
        continue;
      }

      requirements[requirement.key] = effective.source
        ? {completed: true, source: effective.source}
        : {completed: true};
      stepChanged = true;
    }

    if (!stepChanged) {
      return stepProgress;
    }

    changed = true;
    return {...stepProgress, requirements};
  });

  if (!changed) {
    return progress;
  }

  return {...progress, steps: newSteps};
}

export function arePreviousStepsCompleted(
  progress: UserProgress,
  stepId: number,
  steps: TieStepDetail[],
): boolean {
  return steps
    .filter(step => step.id < stepId)
    .every(step => getStepStatus(progress, step.id) === 'completed');
}

export function getFirstIncompleteStepId(
  progress: UserProgress,
  steps: TieStepDetail[],
): number {
  const incomplete = steps.find(
    step => getStepStatus(progress, step.id) !== 'completed',
  );

  return incomplete?.id ?? steps[steps.length - 1]?.id ?? 1;
}

export function getCompletedStepIds(progress: UserProgress): number[] {
  return progress.steps
    .filter(step => step.status === 'completed')
    .map(step => step.stepId);
}

export function isStepAccessible(
  progress: UserProgress,
  stepId: number,
  steps: TieStepDetail[],
): boolean {
  const index = steps.findIndex(step => step.id === stepId);

  if (index <= 0) {
    return true;
  }

  return steps
    .slice(0, index)
    .every(priorStep => isStepCompleted(progress, priorStep.id));
}

export function getRequirementCompletionHintPlace(
  source: RequirementProgress['source'],
): {type: 'profile'} | {type: 'step'; stepId: number} | undefined {
  if (!source) {
    return undefined;
  }

  switch (source.type) {
    case 'referenced_profile':
      return {type: 'profile'};
    case 'referenced_step':
      return {type: 'step', stepId: source.stepId};
    case 'referenced_requirement':
      return {type: 'step', stepId: source.stepId};
    default:
      return undefined;
  }
}

export function isRequirementExternallyCompleted(
  progress: RequirementProgress,
): boolean {
  const type = progress.source?.type;

  return (
    type === 'referenced_step' ||
    type === 'referenced_requirement' ||
    type === 'referenced_profile'
  );
}

export {findRequirementInSteps};
