#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from 'pdf-lib';

import { ensureEx17TextFieldWidgetWidth } from './ex17-pdf-text-field-utils.mjs';

const [
  ,
  ,
  userDataPath = 'src/features/pdfGeneration/forms/ex17/config/ex17-dummy-user.json',
  outputPath = 'src/features/pdfGeneration/forms/ex17/output/ex17-tie.filled.sample.pdf',
  templatePath = 'src/features/pdfGeneration/forms/ex17/assets/ex17-tie.blank.semantic.pdf',
  schemaPath = 'src/features/pdfGeneration/forms/ex17/schemas/ex17-tie.curated.schema.json',
] = process.argv;

function getPathValue(data, source) {
  if (!source) return undefined;
  return source.split('.').reduce((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, data);
}

function splitIsoDate(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

function resolveValue(data, source) {
  const directValue = getPathValue(data, source);
  if (directValue !== undefined) return directValue;

  if (source?.startsWith('applicant.birthDate.')) {
    const date = splitIsoDate(getPathValue(data, 'applicant.birthDate'));
    return date?.[source.split('.').at(-1)];
  }

  if (source?.startsWith('signature.') && ['signature.day', 'signature.month', 'signature.year'].includes(source)) {
    const date = splitIsoDate(getPathValue(data, 'signature.date'));
    return date?.[source.split('.').at(-1)];
  }

  return undefined;
}

function valueAsText(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function shouldCheckField(value, checkedWhen) {
  if (typeof checkedWhen === 'boolean') {
    return value === checkedWhen;
  }
  return valueAsText(value).toLowerCase() === valueAsText(checkedWhen).toLowerCase();
}

function fillField(field, schemaField, data) {
  const value = resolveValue(data, schemaField.source);

  if (field instanceof PDFTextField) {
    ensureEx17TextFieldWidgetWidth(field, schemaField.semanticId);
    field.setText(valueAsText(value));
    return;
  }

  if (field instanceof PDFCheckBox) {
    if (shouldCheckField(value, schemaField.checkedWhen)) {
      field.check();
    } else {
      field.uncheck();
    }
    return;
  }

  if (field instanceof PDFRadioGroup) {
    if (value !== undefined && value !== null && value !== '') {
      field.select(valueAsText(value));
    }
    return;
  }

  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    if (value !== undefined && value !== null && value !== '') {
      field.select(valueAsText(value));
    }
  }
}

const [schema, userData, templateBytes] = await Promise.all([
  fs.readFile(schemaPath, 'utf8').then(JSON.parse),
  fs.readFile(userDataPath, 'utf8').then(JSON.parse),
  fs.readFile(templatePath),
]);

const pdfDoc = await PDFDocument.load(templateBytes);
const form = pdfDoc.getForm();
const missingFields = [];

for (const schemaField of schema.fields) {
  try {
    const fieldName = schemaField.semanticId;
    const field = form.getField(fieldName);
    fillField(field, schemaField, userData);
  } catch (error) {
    missingFields.push({
      semanticId: schemaField.semanticId,
      pdfFieldName: schemaField.pdfFieldName,
      error: error.message,
    });
  }
}

if (missingFields.length > 0) {
  console.warn('Some schema fields could not be filled:');
  console.warn(JSON.stringify(missingFields, null, 2));
}

form.updateFieldAppearances();

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, await pdfDoc.save());

console.log(`Filled EX-17 PDF -> ${outputPath}`);
console.log(`Fields processed: ${schema.fields.length}; missing/errors: ${missingFields.length}`);
