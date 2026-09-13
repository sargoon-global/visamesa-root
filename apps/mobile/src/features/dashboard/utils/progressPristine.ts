import type {UserProgress} from '@/features/dashboard/types/UserProgress';

/** True when no step has been started or completed (fresh install / other-device UI). */
export function isPristineProgress(progress: UserProgress): boolean {
  return progress.steps.every(step => {
    if (step.status !== 'not_started') {
      return false;
    }

    return Object.values(step.requirements).every(
      requirement => !requirement.completed,
    );
  });
}
