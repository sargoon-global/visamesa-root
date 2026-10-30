import {FEE_PAYMENT_RECEIPT_REQUIREMENT_KEY} from '@visamesa/content/tieSteps/profileLock';

import type {
  RequirementProgress,
  UserProgress,
  UserStepProgress,
} from '@/features/dashboard/types/UserProgress';

const LEGACY_PAY_AT_BANK_KEY = 'pay-at-bank';

function mergeReceiptProgress(
  legacy: RequirementProgress | undefined,
  receipt: RequirementProgress | undefined,
): RequirementProgress {
  if (!legacy?.completed && !receipt?.completed) {
    return receipt ?? {completed: false};
  }

  const source =
    receipt?.source ??
    legacy?.source ??
    ({type: 'self_declared'} as RequirementProgress['source']);

  return {
    completed: true,
    source,
  };
}

export function migrateLegacyPayFeeStepProgress(
  stepProgress: UserStepProgress,
): UserStepProgress {
  const legacy = stepProgress.requirements[LEGACY_PAY_AT_BANK_KEY];

  if (!legacy) {
    return stepProgress;
  }

  const receipt =
    stepProgress.requirements[FEE_PAYMENT_RECEIPT_REQUIREMENT_KEY];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {[LEGACY_PAY_AT_BANK_KEY]: _removed, ...rest} = stepProgress.requirements;

  return {
    ...stepProgress,
    requirements: {
      ...rest,
      [FEE_PAYMENT_RECEIPT_REQUIREMENT_KEY]: mergeReceiptProgress(
        legacy,
        receipt,
      ),
    },
  };
}

export function migrateLegacyPayFeeProgress(
  progress: UserProgress,
): UserProgress {
  return {
    ...progress,
    steps: progress.steps.map(migrateLegacyPayFeeStepProgress),
  };
}
