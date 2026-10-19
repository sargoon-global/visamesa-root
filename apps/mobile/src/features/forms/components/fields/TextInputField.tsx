import React from 'react';
import {Controller, useFormContext} from 'react-hook-form';
import type {KeyboardTypeOptions} from 'react-native';

import {TextField} from '@/components/ui/TextField';
import {
  FormField as SchemaFieldType,
  FormFieldKeyboard,
} from '@/features/forms/types/formTypes';

type Props = {
  field: SchemaFieldType;
};

function resolveKeyboardType(
  field: SchemaFieldType,
): KeyboardTypeOptions | undefined {
  if (field.keyboard) {
    const map: Record<FormFieldKeyboard, KeyboardTypeOptions> = {
      default: 'default',
      numeric: 'number-pad',
      phone: 'phone-pad',
      email: 'email-address',
    };
    return map[field.keyboard];
  }

  return field.type === 'number' ? 'number-pad' : 'default';
}

export function TextInputField({field}: Props) {
  const {control} = useFormContext();

  return (
    <Controller
      control={control}
      name={field.id}
      render={({field: controllerField, fieldState}) => (
        <TextField
          label={field.label}
          helperText={field.helperText}
          value={String(controllerField.value ?? '')}
          onChangeText={controllerField.onChange}
          onBlur={controllerField.onBlur}
          placeholder={field.placeholder}
          error={fieldState.error?.message}
          keyboardType={resolveKeyboardType(field)}
          autoCapitalize={
            field.autoCapitalize ??
            (field.type === 'text' ? 'sentences' : 'none')
          }
          autoComplete={field.autoComplete}
          maxLength={field.maxLength}
        />
      )}
    />
  );
}
