import {createUserProgress} from '@/test/fixtures/userProgress';

import {isUserProgressEqual} from './userProgressEquality';

describe('isUserProgressEqual', () => {
  it('returns true for identical progress', () => {
    const progress = createUserProgress({
      currentStepId: 1,
      steps: [
        {
          stepId: 1,
          status: 'in_progress',
          requirements: {'passport-nie': {completed: true}},
        },
      ],
    });

    expect(isUserProgressEqual(progress, progress)).toBe(true);
  });

  it('returns true when steps are in a different order', () => {
    const left = createUserProgress({
      currentStepId: 2,
      steps: [
        {
          stepId: 2,
          status: 'not_started',
          requirements: {},
        },
        {
          stepId: 1,
          status: 'completed',
          requirements: {},
        },
      ],
    });
    const right = createUserProgress({
      currentStepId: 2,
      steps: [
        {
          stepId: 1,
          status: 'completed',
          requirements: {},
        },
        {
          stepId: 2,
          status: 'not_started',
          requirements: {},
        },
      ],
    });

    expect(isUserProgressEqual(left, right)).toBe(true);
  });

  it('returns false when requirement completion differs', () => {
    const left = createUserProgress({
      currentStepId: 1,
      steps: [
        {
          stepId: 1,
          status: 'in_progress',
          requirements: {'passport-nie': {completed: true}},
        },
      ],
    });
    const right = createUserProgress({
      currentStepId: 1,
      steps: [
        {
          stepId: 1,
          status: 'in_progress',
          requirements: {'passport-nie': {completed: false}},
        },
      ],
    });

    expect(isUserProgressEqual(left, right)).toBe(false);
  });
});
