import {createUserProgress} from '@/test/fixtures/userProgress';
import {hasStepProgress, isPristineProgress} from '@/features/dashboard/utils/progressPristine';

describe('progressPristine', () => {
  it('detects started step progress', () => {
    const progress = createUserProgress({
      steps: [{stepId: 2, status: 'in_progress', requirements: {}}],
    });

    expect(hasStepProgress(progress, 2)).toBe(true);
    expect(isPristineProgress(progress)).toBe(false);
  });
});
