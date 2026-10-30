import type {UserProgress} from '@/features/dashboard/types/UserProgress';

export function hasStepProgress(progress: UserProgress, stepId: number): boolean {
  const step = progress.steps.find(entry => entry.stepId === stepId);

  if (!step) {
    return false;
  }

  if (step.status !== 'not_started') {
    return true;
  }

  return Object.values(step.requirements).some(requirement => requirement.completed);
}

/** True when no step has been started or completed (fresh install / other-device UI). */
export function isPristineProgress(progress: UserProgress): boolean {
  return progress.steps.every(step => !hasStepProgress(progress, step.stepId));
}
