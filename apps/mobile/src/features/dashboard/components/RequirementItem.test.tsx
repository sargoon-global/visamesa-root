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
});
