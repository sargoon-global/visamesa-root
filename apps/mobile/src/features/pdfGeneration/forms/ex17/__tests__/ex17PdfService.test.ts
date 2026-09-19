import {PDFDocument} from 'pdf-lib';
import {Share} from 'react-native';

import {
  downloadEx17PdfToDevice,
  generateEx17PdfBytes,
  PdfDownloadDismissedError,
} from '@/features/pdfGeneration/forms/ex17/ex17PdfService';
import {mapProfileToEx17Data} from '@/features/pdfGeneration/forms/ex17/mapProfileToEx17Data';

import type {ProfileData} from '@/features/profile/types/ProfileData';

describe('ex17PdfService', () => {
  it('generates a filled EX-17 PDF from mapped profile data', async () => {
    const profile: ProfileData = {
      personal: {
        firstName: 'Juan',
        lastName: 'Garcia',
        secondLastName: 'Martinez',
        dateOfBirth: '1990-05-15',
        nationality: 'Argentina',
        documentType: 'nie',
        documentNumber: 'X1234567L',
        phoneNumber: {countryCode: '+34', number: '600123456'},
        address: 'Calle Mayor 10',
        city: 'Madrid',
        postalCode: '28013',
      },
    };

    const bytes = await generateEx17PdfBytes(mapProfileToEx17Data(profile));
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    expect(bytes.length).toBeGreaterThan(100_000);
    expect(form.getTextField('applicant.firstName').getText()).toBe('JUAN');
    expect(form.getTextField('applicant.firstSurname').getText()).toBe(
      'GARCIA',
    );
    expect(form.getTextField('applicant.nie.prefix').getText()).toBe('X');
    expect(form.getTextField('applicant.nie.number').getText()).toBe(
      '1234567',
    );
    expect(form.getTextField('applicant.nie.checkDigit').getText()).toBe('L');
  });
});

describe('downloadEx17PdfToDevice', () => {
  const file = {
    fileName: 'ex17-tie-test.pdf',
    path: '/tmp/ex17-tie-test.pdf',
    uri: 'file:///tmp/ex17-tie-test.pdf',
  };

  beforeEach(() => {
    jest.spyOn(Share, 'share').mockReset();
  });

  it('shares the generated PDF when the user completes the download flow', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({action: Share.sharedAction});

    await downloadEx17PdfToDevice(file);

    expect(Share.share).toHaveBeenCalledWith({
      title: file.fileName,
      url: file.uri,
    });
  });

  it('throws when the user dismisses the download sheet', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({action: Share.dismissedAction});

    await expect(downloadEx17PdfToDevice(file)).rejects.toBeInstanceOf(
      PdfDownloadDismissedError,
    );
  });
});
