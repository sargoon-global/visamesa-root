import React from 'react';
import {Pressable, View} from 'react-native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';
import MaterialIcons from '@react-native-vector-icons/material-icons';

import {Icon} from '@/components/ui/Icon';
import {Text} from '@/components/ui/Text';

export const DASHBOARD_EMPTY_ICON: React.ComponentProps<
  typeof MaterialIcons
>['name'] = 'dashboard';

type AppointmentDetails = {
  office: string;
  date: string;
  time: string;
  location?: string;
  confirmationCode?: string;
  isPlaceholder?: boolean;
};

type DashboardTranslate = (
  key:
    | 'appointmentDetailsPlaceholder'
    | 'appointmentOffice'
    | 'appointmentDate'
    | 'appointmentTime'
    | 'appointmentLocation'
    | 'appointmentReferenceCode'
    | 'appointmentNotificationMessage'
    | 'copyAppointmentField',
  options?: Record<string, string>,
) => string;

type AppointmentDetailsMessageProps = {
  t: DashboardTranslate;
  appointment: AppointmentDetails;
  onCopy: (value: string) => void;
};

export function AppointmentDetailsMessage({
  t,
  appointment,
  onCopy,
}: AppointmentDetailsMessageProps) {
  const {styles} = useStyles(stylesheet);
  const rows = [
    {key: 'office', value: appointment.office, canCopy: true},
    {key: 'date', value: appointment.date, canCopy: false},
    {key: 'time', value: appointment.time, canCopy: false},
    {
      key: 'referenceCode',
      value: appointment.confirmationCode,
      canCopy: true,
    },
    {key: 'location', value: appointment.location, canCopy: false},
  ].filter(row => row.value);

  const labels: Record<string, string> = {
    office: t('appointmentOffice', {office: ''}).replace(/: $/, ''),
    date: t('appointmentDate', {date: ''}).replace(/: $/, ''),
    time: t('appointmentTime', {time: ''}).replace(/: $/, ''),
    referenceCode: t('appointmentReferenceCode', {code: ''}).replace(/: $/, ''),
    location: t('appointmentLocation', {location: ''}).replace(/: $/, ''),
  };

  return (
    <View style={styles.message}>
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {t('appointmentNotificationMessage')}
      </Text>
      {rows.map(row => (
        <View
          key={row.key}
          style={styles.row}>
          <View style={styles.valueContainer}>
            <Text variant="labelMedium" color="onSurfaceVariant">
              {labels[row.key]}
            </Text>
            <Text variant="bodyLarge">{row.value}</Text>
          </View>
          {row.canCopy ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('copyAppointmentField', {
                field: labels[row.key],
              })}
              onPress={() => onCopy(String(row.value))}
              hitSlop={8}>
              <Icon name="content-copy" size="md" color="primary" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  message: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  valueContainer: {
    flex: 1,
  },
}));

export function formatAppointmentDetailsMessage(
  t: DashboardTranslate,
  appointment?: AppointmentDetails,
): string {
  if (!appointment || appointment.isPlaceholder) {
    return t('appointmentDetailsPlaceholder');
  }

  const lines = [
    t('appointmentOffice', {office: appointment.office}),
    t('appointmentDate', {date: appointment.date}),
    t('appointmentTime', {time: appointment.time}),
  ];

  if (appointment.confirmationCode) {
    lines.push(
      t('appointmentReferenceCode', {code: appointment.confirmationCode}),
    );
  }

  if (appointment.location) {
    lines.push(t('appointmentLocation', {location: appointment.location}));
  }

  return lines.join('\n');
}