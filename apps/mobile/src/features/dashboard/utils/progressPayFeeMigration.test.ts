import {migrateLegacyPayFeeStepProgress} from '@/features/dashboard/utils/progressPayFeeMigration';

describe('progressPayFeeMigration', () => {
  it('merges legacy pay-at-bank completion into fee-payment-receipt', () => {
    const next = migrateLegacyPayFeeStepProgress({
      stepId: 3,
      status: 'in_progress',
      requirements: {
        'pay-at-bank': {completed: true, source: {type: 'self_declared'}},
        'fee-payment-receipt': {completed: false},
      },
    });

    expect(next.requirements['pay-at-bank']).toBeUndefined();
    expect(next.requirements['fee-payment-receipt'].completed).toBe(true);
  });

  it('leaves steps unchanged when legacy key is absent', () => {
    const step = {
      stepId: 3,
      status: 'not_started' as const,
      requirements: {'fee-payment-receipt': {completed: false}},
    };

    expect(migrateLegacyPayFeeStepProgress(step)).toEqual(step);
  });
});
