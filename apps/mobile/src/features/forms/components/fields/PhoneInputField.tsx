import React from 'react';
import {View} from 'react-native';
import {Controller, useFormContext} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Text} from '@/components/ui/Text';
import {TextField} from '@/components/ui/TextField';
import {FormField as SchemaFieldType} from '@/features/forms/types/formTypes';

type Props = {
  field: SchemaFieldType;
};

export function PhoneInputField({field}: Props) {
  const {styles} = useStyles(stylesheet);
  const {control, formState} = useFormContext();
  const {t} = useTranslation('forms');
  const rootError = formState.errors[field.id]?.message as string | undefined;

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        {field.label}
      </Text>
      <View style={styles.row}>
        <Controller
          control={control}
          name={`${field.id}.countryCode`}
          defaultValue="34"
          render={({field: countryField}) => (
            <TextField
              label={t('phone.countryCode')}
              value={String(countryField.value ?? '')}
              onChangeText={countryField.onChange}
              onBlur={countryField.onBlur}
              placeholder={t('phone.countryCodePlaceholder')}
              keyboardType="number-pad"
              maxLength={3}
              autoComplete="tel-country-code"
              containerStyle={styles.countryCode}
            />
          )}
        />
        <Controller
          control={control}
          name={`${field.id}.number`}
          render={({field: numberField}) => (
            <TextField
              label={t('phone.number')}
              value={String(numberField.value ?? '')}
              onChangeText={numberField.onChange}
              onBlur={numberField.onBlur}
              placeholder="600 000 000"
              keyboardType="phone-pad"
              autoComplete="tel"
              containerStyle={styles.number}
            />
          )}
        />
      </View>
      {rootError ? (
        <Text variant="bodySmall" color="error">
          {rootError}
        </Text>
      ) : null}
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  countryCode: {
    width: 112,
  },
  number: {
    flex: 1,
  },
}));
