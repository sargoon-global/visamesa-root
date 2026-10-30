import React from 'react';
import {Controller, useFormContext} from 'react-hook-form';

import {SelectField} from '@/components/ui/SelectField';
import {FormField as SchemaFieldType} from '@/features/forms/types/formTypes';

type Props = {
  field: SchemaFieldType;
  disabled?: boolean;
};

export function SelectInputField({field, disabled = false}: Props) {
  const {control} = useFormContext();

  return (
    <Controller
      control={control}
      name={field.id}
      render={({field: controllerField, fieldState}) => (
        <SelectField
          label={field.label}
          value={String(controllerField.value ?? '')}
          options={field.options ?? []}
          searchable={field.searchable}
          onChange={controllerField.onChange}
          placeholder={field.placeholder}
          error={fieldState.error?.message}
          disabled={disabled}
        />
      )}
    />
  );
}
