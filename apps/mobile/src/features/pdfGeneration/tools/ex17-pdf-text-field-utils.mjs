import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const MIN_TEXT_FIELD_WIDTHS = JSON.parse(
  readFileSync(
    join(__dirname, '../forms/ex17/config/ex17-text-field-min-widths.json'),
    'utf8',
  ),
);

export function ensureEx17TextFieldWidgetWidth(field, semanticId) {
  const minWidth = MIN_TEXT_FIELD_WIDTHS[semanticId];
  if (!minWidth) return;

  for (const widget of field.acroField.getWidgets()) {
    const rect = widget.getRectangle();
    if (rect.width < minWidth) {
      widget.setRectangle({ ...rect, width: minWidth });
    }
  }
}
