import React, {useState} from 'react';
import {Platform, Pressable, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Controller, useFormContext} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Text} from '@/components/ui/Text';
import {getFormControlContainerStyle} from '@/components/ui/formControlStyles';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {FormField as SchemaFieldType} from '@/features/forms/types/formTypes';

type Props = {
  field: SchemaFieldType;
  disabled?: boolean;
};

const formatDate = (value: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const toIsoDate = (date: Date) => {
  if (!date || typeof date.toISOString !== 'function') {
    return '';
  }
  return date.toISOString().split('T')[0];
};

export function DateInputField({field, disabled = false}: Props) {
  const {styles, theme} = useStyles(stylesheet);
  const {control} = useFormContext();
  const {t} = useTranslation(['forms', 'common']);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  return (
    <Controller
      control={control}
      name={field.id}
      render={({field: controllerField, fieldState}) => {
        const currentValue = String(controllerField.value ?? '');
        const pickerDate = currentValue
          ? new Date(currentValue)
          : new Date();

        const handleValueChange = (_event: any, selectedDate?: Date) => {
          if (selectedDate && typeof selectedDate.toISOString === 'function') {
            if (Platform.OS === 'ios') {
              setTempDate(selectedDate);
            } else {
              controllerField.onChange(toIsoDate(selectedDate));
              setShowPicker(false);
            }
          }
        };

        const handleDismiss = () => {
          setShowPicker(false);
          setTempDate(null);
        };

        const handleDone = () => {
          if (tempDate) {
            controllerField.onChange(toIsoDate(tempDate));
          }
          setShowPicker(false);
          setTempDate(null);
        };

        return (
          <View style={styles.container}>
            <Text variant="labelMedium" style={styles.label}>
              {field.label}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={field.label}
              accessibilityState={{disabled}}
              disabled={disabled}
              android_ripple={
                disabled ? undefined : {color: theme.colors.primaryContainer}
              }
              onPress={() => {
                if (!disabled) {
                  setShowPicker(true);
                }
              }}
              style={({pressed}) => [
                getFormControlContainerStyle(theme, {
                  error: Boolean(fieldState.error),
                }),
                pressed && styles.triggerPressed,
              ]}>
              <Text
                variant="bodyLarge"
                color={currentValue ? 'onSurface' : 'onSurfaceVariant'}>
                {currentValue
                  ? formatDate(currentValue)
                  : field.placeholder ?? t('forms:datePicker.selectPlaceholder')}
              </Text>
            </Pressable>
            {fieldState.error?.message ? (
              <Text variant="bodySmall" color="error" style={styles.error}>
                {fieldState.error.message}
              </Text>
            ) : null}
            {showPicker && Platform.OS === 'android' ? (
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="default"
                onValueChange={handleValueChange}
                onDismiss={handleDismiss}
              />
            ) : null}
            {showPicker && Platform.OS === 'ios' ? (
              <BottomSheet
                visible={showPicker}
                onClose={handleDismiss}
                title={field.label}
                footer={
                  <View style={styles.footerButtons}>
                    <Button
                      label={t('common:actions.cancel')}
                      variant="outline"
                      onPress={handleDismiss}
                    />
                    <Button
                      label={t('forms:datePicker.done')}
                      variant="primary"
                      onPress={handleDone}
                    />
                  </View>
                }>
                <DateTimePicker
                  value={tempDate || pickerDate}
                  mode="date"
                  display="spinner"
                  onValueChange={handleValueChange}
                />
              </BottomSheet>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
  },
  triggerPressed: {
    opacity: 0.88,
  },
  error: {
    marginTop: theme.spacing.xs / 2,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
}));
