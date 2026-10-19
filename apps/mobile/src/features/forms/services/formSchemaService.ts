import {enrichProfilePersonalSchema} from '@/features/profile/data/enrichProfilePersonalSchema';

import profilePersonal from '../data/profile-personal.json';
import {FormSchema} from '../types/formTypes';

const FORM_SCHEMAS: Record<string, FormSchema> = {
  'profile-personal': enrichProfilePersonalSchema(profilePersonal as FormSchema),
};

export async function fetchFormSchema(formId: string): Promise<FormSchema> {
  // TODO: replace with API call when BE endpoint is ready
  const schema = FORM_SCHEMAS[formId];

  if (!schema) {
    throw new Error(`Form schema not found: ${formId}`);
  }

  return schema;
}
