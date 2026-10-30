import React from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {useTranslation} from 'react-i18next';

import {DateInputField} from '@/features/forms/components/fields/DateInputField';
import {PhoneInputField} from '@/features/forms/components/fields/PhoneInputField';
import {SelectInputField} from '@/features/forms/components/fields/SelectInputField';
import {TextInputField} from '@/features/forms/components/fields/TextInputField';
import {FormField} from '@/features/forms/types/formTypes';
import {useFormDisabled} from '@/features/forms/context/FormDisabledContext';
import {isFieldVisible} from '@/features/forms/utils/formFieldVisibility';
import {Text} from '@/components/ui/Text';

type Props = {
  field: FormField;
};

const fieldComponentMap: Record<
  string,
  React.ComponentType<{field: FormField; disabled?: boolean}>
> = {
  text: TextInputField,
  date: DateInputField,
  number: TextInputField,
  select: SelectInputField,
  phone: PhoneInputField,
};

export function FormFieldRenderer({field}: Props) {
  const {control} = useFormContext();
  const {t} = useTranslation('forms');
  const formDisabled = useFormDisabled();
  const values = useWatch({control}) ?? {};

  if (!isFieldVisible(field, values)) {
    return null;
  }

  const FieldComponent = fieldComponentMap[field.type];

  if (!FieldComponent) {
    return (
      <Text variant="bodySmall" color="error">
        {t('errors.unknownFieldType', {type: field.type})}
      </Text>
    );
  }

  return <FieldComponent field={field} disabled={formDisabled} />;
}
