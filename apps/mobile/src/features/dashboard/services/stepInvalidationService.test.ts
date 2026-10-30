import {assessProfileChangeImpact} from '@/features/dashboard/services/stepInvalidationService';
import {fetchUserProgress} from '@/features/dashboard/services/progressService';
import {fetchTieSteps} from '@/features/home/services/tieStepsService';
import {completePersonalRecord} from '@/test/fixtures/personalInfo';
import {createUserProgress} from '@/test/fixtures/userProgress';
import {createTieStep} from '@/test/fixtures/tieSteps';

jest.mock('@/features/dashboard/services/progressService', () => ({
  fetchUserProgress: jest.fn(),
}));

jest.mock('@/features/home/services/tieStepsService', () => ({
  fetchTieSteps: jest.fn(),
}));

const mockFetchUserProgress = fetchUserProgress as jest.Mock;
const mockFetchTieSteps = fetchTieSteps as jest.Mock;

describe('assessProfileChangeImpact', () => {
  const steps = [
    createTieStep({id: 1, slug: 'empadronamiento'}),
    createTieStep({id: 2, slug: 'required-documents'}),
    createTieStep({id: 3, slug: 'pay-fee'}),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTieSteps.mockResolvedValue(steps);
  });

  it('returns no invalidation for pristine progress', async () => {
    mockFetchUserProgress.mockResolvedValue(createUserProgress({steps: []}));

    const impact = await assessProfileChangeImpact(
      {...completePersonalRecord},
      {...completePersonalRecord, email: 'new@example.com'},
    );

    expect(impact.invalidateStepIds).toEqual([]);
    expect(impact.affectedSteps).toEqual([]);
  });

  it('returns no invalidation when previous personal was never saved valid', async () => {
    mockFetchUserProgress.mockResolvedValue(
      createUserProgress({
        steps: [
          {
            stepId: 2,
            status: 'completed',
            requirements: {'ex-17-form': {completed: true}},
          },
        ],
      }),
    );

    const impact = await assessProfileChangeImpact(null, {
      email: 'new@example.com',
    });

    expect(impact.invalidateStepIds).toEqual([]);
  });

  it('lists affected steps when saved profile changes a tracked field', async () => {
    mockFetchUserProgress.mockResolvedValue(
      createUserProgress({
        steps: [
          {stepId: 1, status: 'completed', requirements: {}},
          {
            stepId: 2,
            status: 'completed',
            requirements: {'ex-17-form': {completed: true}},
          },
        ],
      }),
    );

    const impact = await assessProfileChangeImpact(
      {...completePersonalRecord},
      {...completePersonalRecord, email: 'other@example.com'},
    );

    expect(impact.changedFields).toContain('email');
    expect(impact.invalidateStepIds).toEqual([2]);
    expect(impact.affectedSteps).toHaveLength(1);
    expect(impact.affectedSteps[0]?.id).toBe(2);
  });
});
