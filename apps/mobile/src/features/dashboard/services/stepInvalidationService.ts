import {fetchTieSteps} from '@/features/home/services/tieStepsService';
import type {TieStepDetail} from '@/features/home/types/TieStepDetail';
import {fetchUserProgress} from '@/features/dashboard/services/progressService';
import {
  getStepsToInvalidate,
  invalidateSteps,
} from '@/features/dashboard/utils/stepInvalidation';
import {isPristineProgress} from '@/features/dashboard/utils/progressPristine';
import {getChangedPersonalFields} from '@/features/profile/utils/getChangedPersonalFields';
import {
  personalInfoSchema,
  personalRecordForValidation,
} from '@/features/profile/utils/parsePersonalInfo';

export type ProfileChangeImpact = {
  changedFields: ReturnType<typeof getChangedPersonalFields>;
  affectedSteps: TieStepDetail[];
  invalidateStepIds: number[];
};

export async function assessProfileChangeImpact(
  previousPersonal: Record<string, unknown> | null,
  nextPersonal: Record<string, unknown>,
): Promise<ProfileChangeImpact> {
  const changedFields = getChangedPersonalFields(previousPersonal, nextPersonal);
  const [progress, steps] = await Promise.all([
    fetchUserProgress(),
    fetchTieSteps(),
  ]);

  const hadSavedPersonalProfile =
    previousPersonal !== null &&
    personalInfoSchema.safeParse(
      personalRecordForValidation(previousPersonal),
    ).success;

  if (
    changedFields.length === 0 ||
    isPristineProgress(progress) ||
    !hadSavedPersonalProfile
  ) {
    return {
      changedFields,
      affectedSteps: [],
      invalidateStepIds: [],
    };
  }

  const affectedSteps = getStepsToInvalidate(changedFields, progress, steps);

  return {
    changedFields,
    affectedSteps,
    invalidateStepIds: affectedSteps.map(step => step.id),
  };
}
