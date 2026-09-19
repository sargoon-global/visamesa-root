import type {TFunction} from 'i18next';
import {initSharedI18n, i18n} from '@visamesa/content/i18n';

import profilePersonalSchema from '@/features/forms/data/profile-personal.json';
import type {FormSchema} from '@/features/forms/types/formTypes';
import {localizeFormSchema} from '@/features/forms/utils/localizeFormSchema';

const personalSchema = profilePersonalSchema as FormSchema;

describe('localizeFormSchema', () => {
  beforeAll(async () => {
    if (!i18n.isInitialized) {
      await initSharedI18n({language: 'en'});
    }
  });

  it('resolves schema copy from locale keys', () => {
    const localized = localizeFormSchema(
      personalSchema,
      i18n.getFixedT('en', 'forms') as TFunction<'forms'>,
    );

    const genderField = localized.fields.find(field => field.id === 'gender');
    const passportField = localized.fields.find(
      field => field.id === 'passportNumber',
    );

    expect(localized.title).toBe('Personal Information');
    expect(localized.fields[0]?.label).toBe('First Name');
    expect(genderField?.options?.[1]?.label).toBe('Female');
    expect(passportField?.label).toBe('Passport Number');
  });
});
