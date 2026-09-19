#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFHexString,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from 'pdf-lib';

const [
  ,
  ,
  schemaPath = 'src/features/pdfGeneration/forms/ex17/schemas/ex17-tie.curated.schema.json',
  outputPath = 'src/features/pdfGeneration/forms/ex17/assets/ex17-tie.blank.semantic.pdf',
  sourceOverride,
] = process.argv;

async function readBytes(source) {
  if (!/^https?:\/\//i.test(source)) {
    return fs.readFile(source);
  }

  const response = await fetch(source, {
    headers: {
      Accept: 'application/pdf,*/*',
      Referer: new URL(source).origin,
      'User-Agent': 'Mozilla/5.0 PDF semantic field generator',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to download PDF: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('pdf')) {
    throw new Error(`Expected a PDF response, received content-type: ${contentType}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

const MIN_TEXT_FIELD_WIDTHS = {
  'signature.day': 24,
  'applicant.birthDate.day': 22,
};

function ensureTextFieldWidgetWidth(field, semanticId) {
  const minWidth = MIN_TEXT_FIELD_WIDTHS[semanticId];
  if (!minWidth) return;

  for (const widget of field.acroField.getWidgets()) {
    const rect = widget.getRectangle();
    if (rect.width < minWidth) {
      widget.setRectangle({ ...rect, width: minWidth });
    }
  }
}

function clearField(field) {
  if (field instanceof PDFTextField) {
    field.setText('');
    return;
  }

  if (field instanceof PDFCheckBox) {
    field.uncheck();
    return;
  }

  if (field instanceof PDFRadioGroup) {
    field.clear();
    return;
  }

  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    field.clear();
  }
}

const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));
const source = sourceOverride ?? schema.source;

if (!source) {
  throw new Error('Schema does not contain a source PDF URL/path. Pass a source PDF as the third argument.');
}

const pdfDoc = await PDFDocument.load(await readBytes(source));
const form = pdfDoc.getForm();
const usedNames = new Set();

for (const schemaField of schema.fields) {
  if (!schemaField.pdfFieldName || !schemaField.semanticId) {
    throw new Error(`Schema field ${schemaField.index} is missing pdfFieldName or semanticId`);
  }

  if (usedNames.has(schemaField.semanticId)) {
    throw new Error(`Duplicate semantic field name: ${schemaField.semanticId}`);
  }

  const field = form.getField(schemaField.pdfFieldName);
  clearField(field);
  if (field instanceof PDFTextField) {
    ensureTextFieldWidgetWidth(field, schemaField.semanticId);
  }
  field.acroField.setPartialName(schemaField.semanticId);

  // /TU is the human-readable alternate field name shown by many PDF tools.
  // /TM is the mapping name. Keep both aligned with the curated schema.
  if (schemaField.label) {
    field.acroField.dict.set(PDFName.of('TU'), PDFHexString.fromText(schemaField.label));
  }
  field.acroField.dict.set(PDFName.of('TM'), PDFHexString.fromText(schemaField.semanticId));

  usedNames.add(schemaField.semanticId);
}

form.updateFieldAppearances();

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const bytes = await pdfDoc.save();
await fs.writeFile(outputPath, bytes);

console.log(`Generated blank PDF with ${usedNames.size} semantic fields -> ${outputPath}`);
