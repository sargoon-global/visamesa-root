import {NativeModules} from 'react-native';
import {PDFDocument} from 'pdf-lib';
import {Share} from 'react-native';

import {
  downloadEx17PdfToDevice,
  generateEx17PdfBytes,
  openGeneratedPdf,
  PdfDownloadDismissedError,
  saveEx17Pdf,
  shareGeneratedPdf,
} from '@/features/pdfGeneration/forms/ex17/ex17PdfService';
import {completeEx17Profile} from '@/features/pdfGeneration/forms/ex17/__tests__/fixtures/completeEx17Profile';
import {mapProfileToEx17Data} from '@/features/pdfGeneration/forms/ex17/mapProfileToEx17Data';

describe('ex17PdfService', () => {
  it('generates a filled EX-17 PDF from mapped profile data', async () => {
    const bytes = await generateEx17PdfBytes(mapProfileToEx17Data(completeEx17Profile));
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    expect(bytes.length).toBeGreaterThan(100_000);
    expect(form.getTextField('applicant.firstName').getText()).toBe('JUAN');
    expect(form.getTextField('applicant.passportNumber').getText()).toBe(
      'P12345678',
    );
    expect(form.getTextField('applicant.nie.prefix').getText()).toBe('X');
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

describe('shareGeneratedPdf', () => {
  const file = {
    fileName: 'ex17-tie-test.pdf',
    path: '/tmp/ex17-tie-test.pdf',
    uri: 'file:///tmp/ex17-tie-test.pdf',
  };

  beforeEach(() => {
    jest.spyOn(Share, 'share').mockReset();
  });

  it('shares without rejecting when the user dismisses the sheet', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({action: Share.dismissedAction});

    await expect(shareGeneratedPdf(file)).resolves.toBeUndefined();
  });
});

describe('native PdfViewer module', () => {
  const originalPdfViewer = NativeModules.PdfViewer;
  const file = {
    fileName: 'ex17-tie-test.pdf',
    path: '/tmp/ex17-tie-test.pdf',
    uri: 'file:///tmp/ex17-tie-test.pdf',
  };

  afterEach(() => {
    NativeModules.PdfViewer = originalPdfViewer;
  });

  it('throws when saveEx17Pdf is called without a native PDF module', async () => {
    NativeModules.PdfViewer = undefined;

    await expect(saveEx17Pdf({})).rejects.toThrow(
      'PDF viewer module is not available',
    );
  });

  it('throws when openGeneratedPdf is called without a native PDF module', async () => {
    NativeModules.PdfViewer = undefined;

    await expect(openGeneratedPdf(file)).rejects.toThrow(
      'PDF viewer module is not available',
    );
  });

  it('delegates saveEx17Pdf to the native module when available', async () => {
    const savePdfBase64 = jest.fn().mockResolvedValue(file);
    NativeModules.PdfViewer = {savePdfBase64, openPdf: jest.fn()};

    await expect(saveEx17Pdf({applicant: {}})).resolves.toEqual(file);
    expect(savePdfBase64).toHaveBeenCalled();
  });

  it('delegates openGeneratedPdf to the native module when available', async () => {
    const openPdf = jest.fn().mockResolvedValue(undefined);
    NativeModules.PdfViewer = {openPdf, savePdfBase64: jest.fn()};

    await expect(openGeneratedPdf(file)).resolves.toBeUndefined();
    expect(openPdf).toHaveBeenCalledWith(file.path);
  });
});
