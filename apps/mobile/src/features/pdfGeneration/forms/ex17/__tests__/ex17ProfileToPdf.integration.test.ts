import {PDFDocument} from 'pdf-lib';

import {
  completeEx17Personal,
  completeEx17Profile,
} from '@/features/pdfGeneration/forms/ex17/__tests__/fixtures/completeEx17Profile';
import {generateEx17PdfBytes} from '@/features/pdfGeneration/forms/ex17/ex17PdfService';
import {mapProfileToEx17Data} from '@/features/pdfGeneration/forms/ex17/mapProfileToEx17Data';

describe('EX-17 profile to PDF integration', () => {
  it('fills the generated PDF from a complete personal profile end to end', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-19T12:00:00'));
    const mappedData = mapProfileToEx17Data(completeEx17Profile);
    jest.useRealTimers();

    const bytes = await generateEx17PdfBytes(mappedData);
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    expect(form.getTextField('applicant.firstName').getText()).toBe('JUAN');
    expect(form.getTextField('applicant.passportNumber').getText()).toBe('P12345678');
    expect(form.getTextField('applicant.nie.prefix').getText()).toBe('X');
    expect(form.getTextField('applicant.birthPlace').getText()).toBe('BUENOS AIRES');
    expect(form.getTextField('applicant.birthCountry').getText()).toBe('ARGENTINA');
    expect(form.getTextField('applicant.fatherName').getText()).toBe('CARLOS GARCIA');
    expect(form.getTextField('applicant.motherName').getText()).toBe('MARIA MARTINEZ');
    expect(form.getTextField('applicant.address.street').getText()).toBe('CALLE MAYOR');
    expect(form.getTextField('applicant.address.number').getText()).toBe('10');
    expect(form.getTextField('applicant.address.floor').getText()).toBe('3B');
    expect(form.getTextField('applicant.address.city').getText()).toBe('BARCELONA');
    expect(form.getTextField('applicant.address.province').getText()).toBe('BARCELONA');
    expect(form.getTextField('applicant.email').getText()).toBe('juan@example.com');
    expect(form.getCheckBox('applicant.sex.h').isChecked()).toBe(true);
    expect(form.getCheckBox('applicant.maritalStatus.single').isChecked()).toBe(true);
    expect(form.getTextField('signature.place').getText()).toBe('BARCELONA');
    expect(form.getTextField('signature.day').getText()).toBe('19');
    expect(form.getTextField('signature.month').getText()).toBe('09');
    expect(form.getTextField('signature.year').getText()).toBe('2026');
    expect(form.getTextField('notifications.documentNumber').getText()).toBe(
      completeEx17Personal.nieNumber,
    );
  });
});
