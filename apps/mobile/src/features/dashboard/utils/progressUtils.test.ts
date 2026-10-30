import {
  areAllRequirementsComplete,
  arePreviousStepsCompleted,
  getCompletedStepIds,
  getEffectiveRequirementProgress,
  getFirstIncompleteStepId,
  getStepStatus,
  isStepAccessible,
  isStepCompleted,
  materializeEffectiveRequirements,
} from '@/features/dashboard/utils/progressUtils';
import {createTieStep} from '@/test/fixtures/tieSteps';
import {createUserProgress} from '@/test/fixtures/userProgress';

describe('progressUtils', () => {
  const step = createTieStep({
    id: 1,
    requirements: [
      {key: 'passport', label: 'Passport', type: 'self_declared', location: 'in_app'},
      {
        key: 'certificate',
        label: 'Certificate',
        type: 'self_declared',
        location: 'in_app',
        referencesStepId: 2,
      },
    ],
  });

  it('returns not_started when step progress is missing', () => {
    const progress = createUserProgress({steps: []});

    expect(getStepStatus(progress, 1)).toBe('not_started');
  });

  it('marks referenced requirements complete when prior step is effectively done', () => {
    const step1 = createTieStep({
      id: 1,
      requirements: [
        {key: 'passport', label: 'Passport', type: 'self_declared', location: 'in_app'},
      ],
    });
    const step2 = createTieStep({
      id: 2,
      requirements: [
        {key: 'passport', label: 'Passport', type: 'self_declared', location: 'in_app'},
        {
          key: 'certificate',
          label: 'Certificate',
          type: 'self_declared',
          location: 'in_app',
          referencesStepId: 1,
        },
      ],
    });
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'completed',
          requirements: {
            passport: {completed: true, source: {type: 'self_declared'}},
          },
        },
        {
          stepId: 2,
          status: 'not_started',
          requirements: {passport: {completed: false}},
        },
      ],
    });
    const context = {allSteps: [step1, step2]};

    const effective = getEffectiveRequirementProgress(
      progress,
      step2,
      'certificate',
      context,
    );

    expect(effective.completed).toBe(true);
    expect(effective.source?.type).toBe('referenced_step');
  });

  it('marks profile-referenced requirements complete when profile is complete', () => {
    const profileStep = createTieStep({
      id: 2,
      requirements: [
        {
          key: 'personal-id-details',
          label: 'Personal details',
          type: 'self_declared',
          location: 'in_app',
          referencesProfile: true,
        },
      ],
    });

    const progress = createUserProgress({
      steps: [{stepId: 2, status: 'not_started', requirements: {}}],
    });

    const effective = getEffectiveRequirementProgress(
      progress,
      profileStep,
      'personal-id-details',
      {isProfileComplete: true},
    );

    expect(effective.completed).toBe(true);
    expect(effective.source?.type).toBe('referenced_profile');
  });

  it('materializes referenced requirements into stored progress for sync', () => {
    const sourceStep = createTieStep({
      id: 2,
      requirements: [
        {
          key: 'ex-17-form',
          label: 'EX-17',
          type: 'form',
          location: 'in_app',
        },
      ],
    });
    const fingerprintStep = createTieStep({
      id: 5,
      requirements: [
        {
          key: 'ex-17-form',
          label: 'EX-17',
          type: 'self_declared',
          location: 'in_app',
          referencesRequirement: {
            stepSlug: 'required-documents',
            requirementKey: 'ex-17-form',
            stepId: 2,
          },
        },
      ],
    });
    const collectStep = createTieStep({
      id: 6,
      requirements: [
        {
          key: 'resguardo',
          label: 'Resguardo',
          type: 'self_declared',
          location: 'in_app',
          referencesStepId: 5,
        },
      ],
    });
    const allSteps = [sourceStep, fingerprintStep, collectStep];

    const progress = createUserProgress({
      steps: [
        {
          stepId: 2,
          status: 'completed',
          requirements: {
            'ex-17-form': {
              completed: true,
              source: {type: 'form', formId: 'ex-17', confirmedAt: '2026-01-01'},
            },
          },
        },
        {
          stepId: 5,
          status: 'completed',
          completedAt: '2026-01-02',
          requirements: {
            'ex-17-form': {completed: false},
            'attend-appointment': {
              completed: true,
              source: {type: 'self_declared'},
            },
          },
        },
        {
          stepId: 6,
          status: 'completed',
          completedAt: '2026-01-03',
          requirements: {
            resguardo: {completed: false},
            'attend-pickup': {
              completed: true,
              source: {type: 'self_declared'},
            },
          },
        },
      ],
    });

    const materialized = materializeEffectiveRequirements(progress, allSteps, {
      allSteps,
    });

    expect(
      materialized.steps.find(s => s.stepId === 5)?.requirements['ex-17-form']
        ?.completed,
    ).toBe(true);
    expect(
      materialized.steps.find(s => s.stepId === 6)?.requirements.resguardo
        ?.completed,
    ).toBe(true);
    expect(
      materialized.steps.find(s => s.stepId === 6)?.requirements.resguardo
        ?.source?.type,
    ).toBe('referenced_step');
  });

  it('marks requirement-level references complete when source requirement is done', () => {
    const sourceStep = createTieStep({
      id: 2,
      requirements: [
        {
          key: 'ex-17-form',
          label: 'EX-17',
          type: 'form',
          location: 'in_app',
        },
      ],
    });
    const targetStep = createTieStep({
      id: 5,
      requirements: [
        {
          key: 'ex-17-form',
          label: 'EX-17',
          type: 'self_declared',
          location: 'in_app',
          referencesRequirement: {stepSlug: 'required-documents', requirementKey: 'ex-17-form', stepId: 2},
        },
      ],
    });

    const progress = createUserProgress({
      steps: [
        {
          stepId: 2,
          status: 'in_progress',
          requirements: {
            'ex-17-form': {
              completed: true,
              source: {type: 'form', formId: 'ex-17', confirmedAt: '2026-01-01'},
            },
          },
        },
        {stepId: 5, status: 'not_started', requirements: {}},
      ],
    });

    const effective = getEffectiveRequirementProgress(
      progress,
      targetStep,
      'ex-17-form',
      {allSteps: [sourceStep, targetStep]},
    );

    expect(effective.completed).toBe(true);
    expect(effective.source?.type).toBe('referenced_requirement');
  });

  it('checks whether all requirements are complete', () => {
    const step1 = createTieStep({
      id: 2,
      requirements: [
        {key: 'prior', label: 'Prior', type: 'self_declared', location: 'in_app'},
      ],
    });
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'in_progress',
          requirements: {
            passport: {completed: true, source: {type: 'self_declared'}},
            certificate: {completed: false},
          },
        },
        {
          stepId: 2,
          status: 'completed',
          requirements: {
            prior: {completed: true, source: {type: 'self_declared'}},
          },
        },
      ],
    });
    const context = {allSteps: [step, step1]};

    expect(areAllRequirementsComplete(progress, step, context)).toBe(true);
  });

  it('finds the first step not confirmed completed', () => {
    const step1 = createTieStep({
      id: 1,
      requirements: [
        {key: 'passport', label: 'Passport', type: 'self_declared', location: 'in_app'},
      ],
    });
    const progress = createUserProgress({
      currentStepId: 1,
      steps: [
        {
          stepId: 1,
          status: 'completed',
          requirements: {
            passport: {completed: true, source: {type: 'self_declared'}},
          },
        },
        {stepId: 2, status: 'not_started', requirements: {}},
      ],
    });
    const steps = [
      step1,
      createTieStep({id: 2}),
      createTieStep({id: 3}),
    ];

    expect(getFirstIncompleteStepId(progress, steps)).toBe(2);
    expect(isStepCompleted(progress, 1)).toBe(true);
    expect(getCompletedStepIds(progress)).toEqual([1]);
  });

  it('requires stored completion for referenced steps', () => {
    const step1 = createTieStep({
      id: 1,
      requirements: [
        {key: 'passport', label: 'Passport', type: 'self_declared', location: 'in_app'},
      ],
    });
    const step2 = createTieStep({
      id: 2,
      requirements: [
        {
          key: 'certificate',
          label: 'Certificate',
          type: 'self_declared',
          location: 'in_app',
          referencesStepId: 1,
        },
      ],
    });
    const progress = createUserProgress({
      steps: [
        {
          stepId: 1,
          status: 'in_progress',
          requirements: {
            passport: {completed: true, source: {type: 'self_declared'}},
          },
        },
        {stepId: 2, status: 'not_started', requirements: {}},
      ],
    });

    expect(
      getEffectiveRequirementProgress(progress, step2, 'certificate', {
        allSteps: [step1, step2],
      }).completed,
    ).toBe(false);
  });

  it('checks whether previous steps are confirmed completed', () => {
    const steps = [createTieStep({id: 1}), createTieStep({id: 2})];
    const progress = createUserProgress({
      steps: [
        {stepId: 1, status: 'completed', requirements: {}},
        {stepId: 2, status: 'not_started', requirements: {}},
      ],
    });

    expect(arePreviousStepsCompleted(progress, 1, steps)).toBe(true);
    expect(arePreviousStepsCompleted(progress, 2, steps)).toBe(true);
  });

  it('blocks later steps when a previous step is not confirmed completed', () => {
    const steps = [createTieStep({id: 1}), createTieStep({id: 2})];
    const progress = createUserProgress({
      steps: [
        {stepId: 1, status: 'in_progress', requirements: {}},
        {stepId: 2, status: 'not_started', requirements: {}},
      ],
    });

    expect(arePreviousStepsCompleted(progress, 2, steps)).toBe(false);
  });

  it('blocks navigation until previous steps are completed', () => {
    const progress = createUserProgress({
      steps: [
        {stepId: 1, status: 'not_started', requirements: {}},
        {stepId: 2, status: 'not_started', requirements: {}},
      ],
    });
    const steps = [createTieStep({id: 1}), createTieStep({id: 2})];

    expect(isStepAccessible(progress, 1, steps)).toBe(true);
    expect(isStepAccessible(progress, 2, steps)).toBe(false);
  });
});
