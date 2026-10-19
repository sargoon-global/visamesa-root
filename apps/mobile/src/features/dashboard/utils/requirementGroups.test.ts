import {
  groupRequirementsByLocation,
  isGeneratedFormView,
} from '@/features/dashboard/utils/requirementGroups'
import type { RequirementLocation } from '@visamesa/content/tieSteps/detail'
import { EX17_FORM_ID } from '@/features/pdfGeneration/forms/ex17/ex17Constants'

describe('groupRequirementsByLocation', () => {
  it('lists in-app items without a group header', () => {
    const requirements = [
      { key: 'a', label: 'A', type: 'self_declared' as const, location: 'in_app' as RequirementLocation},
      { key: 'b', label: 'B', type: 'self_declared' as const, location: 'in_person' as RequirementLocation},
    ]

    const groups = groupRequirementsByLocation(requirements)

    expect(groups).toHaveLength(2)
    expect(groups[0]?.location).toBeUndefined()
    expect(groups[1]?.location).toBe('in_person')
  })
})

describe('isGeneratedFormView', () => {
  it('returns true for shareable EX-17 forms', () => {
    expect(
      isGeneratedFormView({
        key: 'ex-17-form',
        label: 'EX-17',
        type: 'form',
        location: 'in_app',
        formId: EX17_FORM_ID,
        shareableForm: true,
      }),
    ).toBe(true);
  });

  it('returns true for shareable Modelo 790 forms', () => {
    expect(
      isGeneratedFormView({
        key: 'modelo-790-form',
        label: 'Modelo 790',
        type: 'form',
        location: 'in_app',
        formId: 'modelo-790-012',
        shareableForm: true,
      }),
    ).toBe(true);
  });

  it('returns false when shareable metadata is missing', () => {

    expect(
      isGeneratedFormView({
        key: 'ex-17-form',
        label: 'EX-17',
        type: 'form',
        location: 'in_app',
        formId: EX17_FORM_ID,
      }),
    ).toBe(false);
  });
})
