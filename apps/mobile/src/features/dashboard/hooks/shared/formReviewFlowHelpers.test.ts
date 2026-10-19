import {enrichShareableFormRequirement} from '@/features/dashboard/hooks/shared/formReviewFlowHelpers';
import {EX17_FORM_ID} from '@/features/pdfGeneration/forms/ex17/ex17Constants';
import type {RequirementWithProgress} from '@/features/dashboard/components/RequirementsChecklist';

const baseRequirement: RequirementWithProgress = {
  key: 'ex-17-form',
  label: 'EX-17',
  type: 'form',
  location: 'in_app',
  formId: EX17_FORM_ID,
  shareableForm: true,
  progress: {completed: false},
};

describe('enrichShareableFormRequirement', () => {
  it('enables approve when pending matches the current step', () => {
    const enriched = enrichShareableFormRequirement(
      baseRequirement,
      EX17_FORM_ID,
      {requirementKey: 'ex-17-form', formId: EX17_FORM_ID, stepId: 2},
      2,
      {formReviewLoading: false, formDownloadLoading: false},
    );

    expect(enriched.canApproveDownload).toBe(true);
    expect(enriched.showApproveDownload).toBe(true);
  });

  it('disables approve when pending belongs to another step', () => {
    const enriched = enrichShareableFormRequirement(
      baseRequirement,
      EX17_FORM_ID,
      {requirementKey: 'ex-17-form', formId: EX17_FORM_ID, stepId: 3},
      2,
      {formReviewLoading: false, formDownloadLoading: false},
    );

    expect(enriched.canApproveDownload).toBe(false);
  });
});
