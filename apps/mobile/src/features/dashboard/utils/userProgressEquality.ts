import type {
  RequirementProgress,
  UserProgress,
  UserStepProgress,
} from '@/features/dashboard/types/UserProgress';

function requirementProgressEqual(
  a: RequirementProgress,
  b: RequirementProgress,
): boolean {
  if (a.completed !== b.completed) {
    return false;
  }

  if (a.source === undefined && b.source === undefined) {
    return true;
  }

  if (a.source === undefined || b.source === undefined) {
    return false;
  }

  return JSON.stringify(a.source) === JSON.stringify(b.source);
}

function userStepProgressEqual(a: UserStepProgress, b: UserStepProgress): boolean {
  if (
    a.stepId !== b.stepId ||
    a.status !== b.status ||
    a.startedAt !== b.startedAt ||
    a.completedAt !== b.completedAt
  ) {
    return false;
  }

  const keysA = Object.keys(a.requirements).sort();
  const keysB = Object.keys(b.requirements).sort();

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every(
    (key, index) =>
      key === keysB[index] &&
      requirementProgressEqual(a.requirements[key], b.requirements[key]),
  );
}

/** Stable structural equality for {@link UserProgress} (order-insensitive step lists). */
export function isUserProgressEqual(a: UserProgress, b: UserProgress): boolean {
  if (a.currentStepId !== b.currentStepId || a.steps.length !== b.steps.length) {
    return false;
  }

  const sortedA = [...a.steps].sort((left, right) => left.stepId - right.stepId);
  const sortedB = [...b.steps].sort((left, right) => left.stepId - right.stepId);

  return sortedA.every((step, index) => userStepProgressEqual(step, sortedB[index]));
}
