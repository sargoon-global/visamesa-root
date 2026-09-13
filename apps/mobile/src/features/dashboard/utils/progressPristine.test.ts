import {createUserProgress} from '@/test/fixtures/userProgress';

import {isPristineProgress} from './progressPristine';

describe('isPristineProgress', () => {
  it('returns true for fresh progress', () => {
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'not_started',
          requirements: {
            passport: {completed: false},
          },
        },
      ],
    });

    expect(isPristineProgress(progress)).toBe(true);
  });

  it('returns false when a step is in progress', () => {
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'in_progress',
          requirements: {
            passport: {completed: false},
          },
        },
      ],
    });

    expect(isPristineProgress(progress)).toBe(false);
  });

  it('returns false when a requirement is completed', () => {
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'not_started',
          requirements: {
            passport: {completed: true, source: {type: 'self_declared'}},
          },
        },
      ],
    });

    expect(isPristineProgress(progress)).toBe(false);
  });
});
