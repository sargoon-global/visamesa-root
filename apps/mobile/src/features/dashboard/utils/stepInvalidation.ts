import {TIE_STEP_ORDER} from '@visamesa/content/tieSteps/detail';

import {STEP_PROFILE_DEPENDENCIES} from '@/features/dashboard/data/stepProfileDependencies';
import type {TieStepDetail} from '@/features/home/types/TieStepDetail';
import type {PersonalInfo} from '@/features/profile/utils/parsePersonalInfo';
import type {UserProgress} from '@/features/dashboard/types/UserProgress';
import {hasStepProgress} from '@/features/dashboard/utils/progressPristine';

export function getStepsToInvalidate(
  changedFields: (keyof PersonalInfo)[],
  progress: UserProgress,
  steps: TieStepDetail[],
): TieStepDetail[] {
  if (changedFields.length === 0) {
    return [];
  }

  const changedSet = new Set(changedFields);
  let earliestOrderIndex: number = TIE_STEP_ORDER.length;

  TIE_STEP_ORDER.forEach((slug, index) => {
    const deps = STEP_PROFILE_DEPENDENCIES[slug];
    if (deps.some(field => changedSet.has(field))) {
      earliestOrderIndex = Math.min(earliestOrderIndex, index);
    }
  });

  if (earliestOrderIndex >= TIE_STEP_ORDER.length) {
    return [];
  }

  const slugsToReset = TIE_STEP_ORDER.slice(earliestOrderIndex);
  const stepIdsToReset = new Set(
    slugsToReset
      .map(slug => steps.find(step => step.slug === slug)?.id)
      .filter((id): id is number => id !== undefined),
  );

  return steps.filter(
    step => stepIdsToReset.has(step.id) && hasStepProgress(progress, step.id),
  );
}

export function invalidateSteps(
  progress: UserProgress,
  stepIds: number[],
): UserProgress {
  if (stepIds.length === 0) {
    return progress;
  }

  const resetIds = new Set(stepIds);
  const earliestResetId = Math.min(...stepIds);

  const steps = progress.steps.map(step => {
    if (!resetIds.has(step.stepId)) {
      return step;
    }

    const requirements = Object.fromEntries(
      Object.keys(step.requirements).map(key => [key, {completed: false}]),
    );

    return {
      ...step,
      status: 'not_started' as const,
      requirements,
      startedAt: undefined,
      completedAt: undefined,
    };
  });

  return {
    ...progress,
    currentStepId: Math.min(progress.currentStepId, earliestResetId),
    steps,
  };
}
