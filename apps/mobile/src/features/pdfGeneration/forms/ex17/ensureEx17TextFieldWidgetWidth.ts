import type {PDFTextField} from 'pdf-lib';

import minWidths from './config/ex17-text-field-min-widths.json';

const MIN_TEXT_FIELD_WIDTHS = minWidths as Record<string, number>;

export function ensureEx17TextFieldWidgetWidth(
  field: PDFTextField,
  semanticId: string,
) {
  const minWidth = MIN_TEXT_FIELD_WIDTHS[semanticId];
  if (!minWidth) {
    return;
  }

  for (const widget of field.acroField.getWidgets()) {
    const rect = widget.getRectangle();
    if (rect.width < minWidth) {
      widget.setRectangle({...rect, width: minWidth});
    }
  }
}
