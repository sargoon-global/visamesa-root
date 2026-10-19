export const FIELD_TYPES = [
  'text',
  'date',
  'number',
  'select',
  'dateRange',
  'timeRange',
  'phone',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormFieldKeyboard = 'default' | 'numeric' | 'phone' | 'email';

export type FormFieldAutoCapitalize = 'none' | 'sentences' | 'words' | 'characters';

export type FormFieldAutoComplete =
  | 'name'
  | 'given-name'
  | 'family-name'
  | 'email'
  | 'tel'
  | 'postal-code'
  | 'street-address'
  | 'off';

export type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  patternMessage?: string;
  helperText?: string;
  maxLength?: number;
  keyboard?: FormFieldKeyboard;
  autoCapitalize?: FormFieldAutoCapitalize;
  autoComplete?: FormFieldAutoComplete;
  searchable?: boolean;
  options?: FormFieldOption[];
  dependsOn?: {
    fieldId: string;
    value: string;
  };
};

export type FormSchema = {
  formId: string;
  title: string;
  description?: string;
  fields: FormField[];
};
