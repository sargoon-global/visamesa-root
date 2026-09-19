import React from 'react';

import {RequirementItem} from '@/features/dashboard/components/RequirementItem';
import {renderComponent} from '@/test/testRenderer';

describe('RequirementItem', () => {
  it('does not render requirement detail text on the checklist', () => {
    const tree = renderComponent(
      <RequirementItem
        requirement={{
          key: 'appointment-confirmation',
          label: 'Appointment confirmation',
          description: 'Book your visit — VisaMesa can help.',
          detail: 'Detailed appointment instructions.',
          type: 'assisted_booking',
          location: 'in_app',
          bookingAssistantId: 'empadronamiento',
        }}
        progress={{completed: false}}
        interactive
      />,
    );

    const output = JSON.stringify(tree.toJSON());
    expect(output).toContain('Book your visit — VisaMesa can help.');
    expect(output).not.toContain('Detailed appointment instructions.');
  });

  it('shows disabled booking assistant actions when not interactive', () => {
    const tree = renderComponent(
      <RequirementItem
        requirement={{
          key: 'appointment-confirmation',
          label: 'Appointment confirmation',
          description: 'Book your visit — VisaMesa can help.',
          type: 'assisted_booking',
          location: 'in_app',
          bookingAssistantId: 'empadronamiento',
        }}
        progress={{completed: false}}
        interactive={false}
      />,
    );

    expect(JSON.stringify(tree.toJSON())).toContain('Book via VisaMesa');
  });

  it('shows disabled booking assistant actions when dependencies are not met', () => {
    const tree = renderComponent(
      <RequirementItem
        requirement={{
          key: 'appointment-confirmation',
          label: 'Appointment confirmation',
          description: 'Book your visit — VisaMesa can help.',
          type: 'assisted_booking',
          location: 'in_app',
          bookingAssistantId: 'empadronamiento',
        }}
        progress={{completed: false}}
        interactive
        canUseActions={false}
      />,
    );

    const output = JSON.stringify(tree.toJSON());
    expect(output).toContain('Book via VisaMesa');
    expect(output).toContain('"accessibilityHint":"Complete the items above first."');
    expect(output).toContain('"accessibilityState":{"disabled":true}');
  });

  it('does not show the view action for EX-17 before approval', () => {
    const tree = renderComponent(
      <RequirementItem
        requirement={{
          key: 'ex-17-form',
          label: 'EX-17 application form',
          description: 'Review the form VisaMesa filled for you.',
          type: 'form',
          location: 'in_app',
          formId: 'ex-17',
          shareableForm: true,
        }}
        progress={{completed: false}}
        interactive
        showApproveDownload
      />,
    );

    const output = JSON.stringify(tree.toJSON());
    expect(output).not.toContain('visibility');
    expect(output).not.toContain('share');
    expect(output).toContain('Approve and download');
    expect(output).toContain('"accessibilityHint":"Review the form first"');
  });

  it('shows an enabled view action for approved EX-17 forms', () => {
    const tree = renderComponent(
      <RequirementItem
        requirement={{
          key: 'ex-17-form',
          label: 'EX-17 application form',
          description: 'Review the form VisaMesa filled for you.',
          type: 'form',
          location: 'in_app',
          formId: 'ex-17',
          shareableForm: true,
        }}
        progress={{
          completed: true,
          source: {type: 'form', formId: 'ex-17', confirmedAt: '2026-01-01'},
        }}
        interactive
        onFormView={jest.fn()}
      />,
    );

    const output = JSON.stringify(tree.toJSON());
    expect(output).toContain('visibility');
    expect(output).toContain('"disabled":false');
    expect(output).toContain('"busy":false');
  });

  it('shows a loading indicator on the review button while the form opens', () => {
    const tree = renderComponent(
      <RequirementItem
        requirement={{
          key: 'ex-17-form',
          label: 'EX-17 application form',
          description: 'Review the form VisaMesa filled for you.',
          type: 'form',
          location: 'in_app',
          formId: 'ex-17',
          shareableForm: true,
        }}
        progress={{completed: false}}
        interactive
        showApproveDownload
        formReviewLoading
        onFormPress={jest.fn()}
      />,
    );

    const output = JSON.stringify(tree.toJSON());
    expect(output).toContain('ActivityIndicator');
    expect(output).toContain('Review form filled by VisaMesa');
  });

  it('shows a loading indicator on the view action while the form opens', () => {
    const tree = renderComponent(
      <RequirementItem
        requirement={{
          key: 'ex-17-form',
          label: 'EX-17 application form',
          description: 'Review the form VisaMesa filled for you.',
          type: 'form',
          location: 'in_app',
          formId: 'ex-17',
          shareableForm: true,
        }}
        progress={{
          completed: true,
          source: {type: 'form', formId: 'ex-17', confirmedAt: '2026-01-01'},
        }}
        interactive
        formReviewLoading
        onFormView={jest.fn()}
      />,
    );

    const output = JSON.stringify(tree.toJSON());
    expect(output).toContain('ActivityIndicator');
    expect(output).toContain('"disabled":true');
    expect(output).toContain('"busy":true');
  });
});
