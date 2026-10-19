import {z} from 'zod';

import {normalizePhone, stringToPhone} from '@/features/forms/utils/phoneUtils';
import {isFieldVisible} from '@/features/forms/utils/formFieldVisibility';
import profilePersonalSchema from '@/features/forms/data/profile-personal.json';
import type {FormSchema} from '@/features/forms/types/formTypes';
import {VISA_MESA_SUPPORTED_PROVINCE} from '@/features/profile/data/barcelonaScope';
import {STREET_TYPE_VALUES} from '@/features/profile/data/streetTypes';

const PERSONAL_FORM = profilePersonalSchema as FormSchema;

const phoneSchema = z.object({
  countryCode: z.string().min(1),
  number: z.string().min(1),
});

export const personalInfoSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    secondLastName: z.string().trim().optional(),
    gender: z.string().trim().min(1),
    dateOfBirth: z.string().trim().min(1),
    cityOfBirth: z.string().trim().min(1),
    countryOfBirth: z.string().trim().min(1),
    nationality: z.string().trim().min(1),
    maritalStatus: z.string().trim().min(1),
    fatherName: z.string().trim().min(1),
    motherName: z.string().trim().min(1),
    nieNumber: z
      .string()
      .trim()
      .transform(value => value.replace(/[\s-]/g, '').toUpperCase())
      .pipe(z.string().regex(/^[XYZ]\d{7}[A-Z]$/)),
    passportNumber: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{5,20}$/),
    phoneNumber: phoneSchema,
    streetType: z.enum(
      STREET_TYPE_VALUES as unknown as [
        (typeof STREET_TYPE_VALUES)[number],
        ...(typeof STREET_TYPE_VALUES)[number][],
      ],
    ),
    address: z.string().trim().min(1),
    addressNumber: z.string().trim().min(1).max(8),
    addressFloor: z.string().trim().optional(),
    addressDoor: z.string().trim().optional(),
    city: z.string().trim().min(1),
    province: z.literal(VISA_MESA_SUPPORTED_PROVINCE),
    postalCode: z.string().trim().regex(/^\d{5}$/),
    email: z.string().trim().email(),
    hasEmpadronamiento: z.enum(['no', 'yes']),
    empadronamientoIssuedAt: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const countryCode = data.phoneNumber.countryCode.replace(/\D/g, '');
    const number = data.phoneNumber.number.replace(/\D/g, '');
    const totalDigits = `${countryCode}${number}`.replace(/\D/g, '').length;

    if (totalDigits < 6 || totalDigits > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phoneNumber'],
        message: 'phoneDigits',
      });
    }

    if (data.hasEmpadronamiento === 'yes' && !data.empadronamientoIssuedAt?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['empadronamientoIssuedAt'],
        message: 'required',
      });
    }
  });

export type PersonalInfo = z.infer<typeof personalInfoSchema>;

export type ParsePersonalInfoResult =
  | {ok: true; data: PersonalInfo}
  | {ok: false; issues: z.ZodIssue[]};

function readPhone(value: unknown): {countryCode: string; number: string} | null {
  if (value && typeof value === 'object') {
    const normalized = normalizePhone(
      value as {countryCode?: string; number?: string},
    );
    if (normalized.countryCode && normalized.number) {
      return {
        countryCode: normalized.countryCode,
        number: normalized.number,
      };
    }
    return null;
  }

  if (typeof value === 'string') {
    const parsed = stringToPhone(value);
    if (parsed?.countryCode && parsed.number) {
      return {
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    }
  }

  return null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Maps decrypted personal section into the shape expected by personalInfoSchema. */
export function personalRecordForValidation(
  personal: Record<string, unknown>,
): Record<string, unknown> {
  const phone = readPhone(personal.phoneNumber);

  return {
    ...personal,
    secondLastName: text(personal.secondLastName) || undefined,
    addressFloor: text(personal.addressFloor) || undefined,
    addressDoor: text(personal.addressDoor) || undefined,
    province: text(personal.province) || VISA_MESA_SUPPORTED_PROVINCE,
    phoneNumber: phone ?? personal.phoneNumber,
    empadronamientoIssuedAt:
      text(personal.empadronamientoIssuedAt) || undefined,
  };
}

function missingFieldIssue(fieldId: string): z.ZodIssue {
  return {
    code: z.ZodIssueCode.custom,
    path: [fieldId],
    message: 'required',
  } as z.ZodIssue;
}

export function parsePersonalInfo(
  personal: Record<string, unknown> | null,
): ParsePersonalInfoResult {
  if (!personal) {
    return {ok: false, issues: [missingFieldIssue('personal')]};
  }

  for (const field of PERSONAL_FORM.fields) {
    if (field.required !== true || !isFieldVisible(field, personal)) {
      continue;
    }

    const value = personal[field.id];
    if (value === undefined || value === null || value === '') {
      return {ok: false, issues: [missingFieldIssue(field.id)]};
    }

    if (field.id === 'phoneNumber' && !readPhone(value)) {
      return {ok: false, issues: [missingFieldIssue('phoneNumber')]};
    }
  }

  const parsed = personalInfoSchema.safeParse(personalRecordForValidation(personal));
  if (parsed.success) {
    return {ok: true, data: parsed.data};
  }

  return {ok: false, issues: parsed.error.issues};
}

export function parsePersonalInfoFieldNames(
  personal: Record<string, unknown> | null,
): string {
  const result = parsePersonalInfo(personal);
  if (result.ok) {
    return '';
  }

  if (result.issues.length === 0) {
    return 'personal';
  }

  return [...new Set(result.issues.map(issue => String(issue.path[0] ?? 'personal')))].join(
    ',',
  );
}
