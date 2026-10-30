import {createTieStep} from '@/test/fixtures/tieSteps';
import {createUserProgress} from '@/test/fixtures/userProgress';
import {completePersonalRecord} from '@/test/fixtures/personalInfo';
import {getChangedPersonalFields} from '@/features/profile/utils/getChangedPersonalFields';
import {
  getStepsToInvalidate,
  invalidateSteps,
} from '@/features/dashboard/utils/stepInvalidation';

describe('stepInvalidation', () => {
  const steps = [
    createTieStep({id: 1, slug: 'empadronamiento'}),
    createTieStep({id: 2, slug: 'required-documents'}),
    createTieStep({id: 3, slug: 'pay-fee'}),
    createTieStep({id: 4, slug: 'toma-de-huellas'}),
  ];

  it('detects email change from step 2 onward', () => {
    const previous = {...completePersonalRecord};
    const next = {...completePersonalRecord, email: 'other@example.com'};
    const changed = getChangedPersonalFields(previous, next);
    const progress = createUserProgress({
      steps: [
        {stepId: 1, status: 'completed', requirements: {}},
        {
          stepId: 2,
          status: 'completed',
          requirements: {'ex-17-form': {completed: true}},
        },
        {stepId: 3, status: 'not_started', requirements: {}},
      ],
    });

    const affected = getStepsToInvalidate(changed, progress, steps);

    expect(affected.map(step => step.id)).toEqual([2]);
  });

  it('resets invalidated step requirements', () => {
    const progress = createUserProgress({
      currentStepId: 4,
      steps: [
        {
          stepId: 4,
          status: 'in_progress',
          requirements: {'appointment-confirmation': {completed: true}},
        },
      ],
    });

    const next = invalidateSteps(progress, [4]);

    expect(next.steps[0].status).toBe('not_started');
    expect(next.steps[0].requirements['appointment-confirmation'].completed).toBe(
      false,
    );
    expect(next.currentStepId).toBe(4);
  });
});
