import React from 'react';

import {renderComponent, act} from '@/test/testRenderer';
import {Text} from '@/components/ui/Text';

import {AppointmentDetailsMessage} from './dashboardContent';

describe('AppointmentDetailsMessage', () => {
  const t = (key: string, options?: Record<string, string>) => {
    const labels: Record<string, string> = {
      appointmentNotificationMessage: 'Confirmation message',
      appointmentOffice: `Office: ${options?.office ?? ''}`,
      appointmentDate: `Date: ${options?.date ?? ''}`,
      appointmentTime: `Time: ${options?.time ?? ''}`,
      appointmentReferenceCode: `Reference code: ${options?.code ?? ''}`,
      appointmentLocation: `Location: ${options?.location ?? ''}`,
      copyAppointmentField: `Copy ${options?.field ?? ''}`,
    };
    return labels[key] ?? key;
  };

  it('renders appointment fields in the expected order', () => {
    const tree = renderComponent(
      <AppointmentDetailsMessage
        t={t}
        appointment={{
          office: 'Office A',
          date: '2026-11-25',
          time: '11:40',
          confirmationCode: '16723178',
          location: 'Barcelona',
        }}
        onCopy={jest.fn()}
      />,
    );

    const text = tree.root
      .findAllByType(Text)
      .map(node => String(node.props.children))
      .join('|');

    expect(text.indexOf('Office A')).toBeLessThan(text.indexOf('2026-11-25'));
    expect(text.indexOf('2026-11-25')).toBeLessThan(text.indexOf('11:40'));
    expect(text.indexOf('11:40')).toBeLessThan(text.indexOf('16723178'));
    expect(text.indexOf('16723178')).toBeLessThan(text.indexOf('Barcelona'));
  });

  it('copies office and reference code values', () => {
    const onCopy = jest.fn();
    const tree = renderComponent(
      <AppointmentDetailsMessage
        t={t}
        appointment={{
          office: 'Office A',
          date: '2026-11-25',
          time: '11:40',
          confirmationCode: '16723178',
        }}
        onCopy={onCopy}
      />,
    );

    const copyButtons = tree.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );
    expect(copyButtons).toHaveLength(2);

    act(() => copyButtons[0].props.onPress());
    act(() => copyButtons[1].props.onPress());

    expect(onCopy.mock.calls).toEqual([['Office A'], ['16723178']]);
  });
});
