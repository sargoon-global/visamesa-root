import type {FormSchema} from '@/features/forms/types/formTypes';

import {streetTypeFormOptions} from './streetTypes';

export function enrichProfilePersonalSchema(schema: FormSchema): FormSchema {
  return {
    ...schema,
    fields: schema.fields
      .filter(field => field.id !== 'province')
      .map(field => {
        if (field.id === 'streetType') {
          return {...field, options: streetTypeFormOptions()};
        }
        return field;
      }),
  };
}
