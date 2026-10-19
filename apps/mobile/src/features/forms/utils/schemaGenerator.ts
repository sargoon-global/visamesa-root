import {isEmpadronamientoCertificateValid} from '@visamesa/content/tieSteps/detail';
import {z} from 'zod';

import type {FormField, FormSchema} from '../types/formTypes';
import {isFieldVisible} from './formFieldVisibility';

type ZodSchemaFields = Record<string, z.ZodTypeAny>;

export type FormTranslateFn = (
  key: string,
  options?: Record<string, string>,
) => string;

function buildFieldSchema(
  field: FormField,
  required: boolean,
  translate?: FormTranslateFn,
): z.ZodTypeAny {
  const requiredMessage = (label: string) =>
    translate?.('validation.required', {label}) ?? `${label} is required.`;
  const invalidFormatMessage = (formField: FormField) =>
    (formField.patternMessage
      ? translate?.(formField.patternMessage)
      : undefined) ??
    translate?.('validation.invalidFormat') ??
    'Invalid format. Check the input requirements.';

  if (field.type === 'phone') {
    const phoneSchema = z.object({
      countryCode: z.string().optional(),
      number: z.string().optional(),
    });

    if (!required) {
      return phoneSchema.optional();
    }

    return phoneSchema
      .refine(
        data => Boolean(data.countryCode?.trim()) && Boolean(data.number?.trim()),
        {
          message: requiredMessage(field.label),
        },
      )
      .superRefine((data, ctx) => {
        const countryCode = (data.countryCode ?? '').replace(/\D/g, '');
        const number = (data.number ?? '').replace(/\D/g, '');
        const totalDigits = `${countryCode}${number}`.length;
        if (totalDigits > 0 && (totalDigits < 6 || totalDigits > 15)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              translate?.('validation.phoneDigits') ??
              'Enter a phone number between 6 and 15 digits.',
          });
        }
      });
  }

  if (field.type === 'dateRange' || field.type === 'timeRange') {
    const rangeSchema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    });

    if (!required) {
      return rangeSchema.optional();
    }

    return rangeSchema.refine(data => Boolean(data.from && data.to), {
      message: requiredMessage(field.label),
    });
  }

  let zodField = z.string();

  if (field.maxLength) {
    zodField = zodField.max(field.maxLength, {
      message: invalidFormatMessage(field),
    });
  }

  if (field.pattern) {
    zodField = zodField.regex(new RegExp(field.pattern), invalidFormatMessage(field));
  }

  if (!required) {
    return zodField.nullable().or(z.literal('')).optional();
  }

  return zodField.min(1, {
    message: requiredMessage(field.label),
  });
}

function validateRequiredFieldValue(
  field: FormField,
  value: unknown,
  ctx: z.RefinementCtx,
  translate?: FormTranslateFn,
) {
  const result = buildFieldSchema(field, true, translate).safeParse(value);

  if (result.success) {
    return;
  }

  for (const issue of result.error.issues) {
    ctx.addIssue({
      ...issue,
      path: [field.id, ...issue.path],
    });
  }
}

function validateEmpadronamientoIssuedAt(
  field: FormField,
  data: Record<string, unknown>,
  ctx: z.RefinementCtx,
  translate?: FormTranslateFn,
) {
  if (field.id !== 'empadronamientoIssuedAt' || !isFieldVisible(field, data)) {
    return;
  }

  const issuedAt = data[field.id];

  const isExpiredCertificate =
    typeof issuedAt === 'string' &&
    issuedAt.length > 0 &&
    !isEmpadronamientoCertificateValid(issuedAt);

  if (isExpiredCertificate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [field.id],
      message: translate?.('validation.empadronamientoCertificateExpired'),
    });
  }
}

export const generateZodSchema = (
  schema: FormSchema,
  translate?: FormTranslateFn,
) => {
  const schemaFields: ZodSchemaFields = {};

  schema.fields.forEach(field => {
    const requiredAtParseTime = Boolean(field.required && !field.dependsOn);
    schemaFields[field.id] = buildFieldSchema(
      field,
      requiredAtParseTime,
      translate,
    );
  });

  return z.object(schemaFields).superRefine((data, ctx) => {
    schema.fields.forEach(field => {
      if (field.required && field.dependsOn && isFieldVisible(field, data)) {
        validateRequiredFieldValue(field, data[field.id], ctx, translate);
      }

      validateEmpadronamientoIssuedAt(field, data, ctx, translate);
    });
  });
};
