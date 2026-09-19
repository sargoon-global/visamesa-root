import {PDFDocument} from 'pdf-lib';
import {toByteArray} from 'react-native-quick-base64';

import {EX17_TIE_BLANK_SEMANTIC_PDF_BASE64} from '@/features/pdfGeneration/forms/ex17/assets/ex17TieBlankSemanticPdfBase64';
import {ensureEx17TextFieldWidgetWidth} from '@/features/pdfGeneration/forms/ex17/ensureEx17TextFieldWidgetWidth';

async function loadBlankPdf() {
  const templateBytes = toByteArray(EX17_TIE_BLANK_SEMANTIC_PDF_BASE64, true);
  return PDFDocument.load(templateBytes);
}

describe('ensureEx17TextFieldWidgetWidth', () => {
  it('widens narrow signature day widgets before text is rendered', async () => {
    const pdfDoc = await loadBlankPdf();
    const form = pdfDoc.getForm();
    const dayField = form.getTextField('signature.day');
    const originalWidth = dayField.acroField.getWidgets()[0].getRectangle().width;

    expect(originalWidth).toBeLessThan(24);

    ensureEx17TextFieldWidgetWidth(dayField, 'signature.day');
    dayField.setText('19');
    form.updateFieldAppearances();

    expect(dayField.getText()).toBe('19');
    expect(dayField.acroField.getWidgets()[0].getRectangle().width).toBeGreaterThanOrEqual(
      24,
    );
  });

  it('leaves fields without configured minimum widths unchanged', async () => {
    const pdfDoc = await loadBlankPdf();
    const form = pdfDoc.getForm();
    const monthField = form.getTextField('signature.month');
    const originalWidth = monthField.acroField.getWidgets()[0].getRectangle().width;

    ensureEx17TextFieldWidgetWidth(monthField, 'signature.month');

    expect(monthField.acroField.getWidgets()[0].getRectangle().width).toBe(
      originalWidth,
    );
  });
});
