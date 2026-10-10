import {NativeModules, Share} from 'react-native';

export type GeneratedPdfFile = {
  fileName: string;
  path: string;
  uri: string;
};

type PdfViewerNativeModule = {
  openPdf: (pathOrUri: string) => Promise<void>;
  savePdfBase64: (
    base64: string,
    fileName: string,
  ) => Promise<GeneratedPdfFile>;
};

function getPdfViewerModule(): PdfViewerNativeModule | undefined {
  return NativeModules.PdfViewer as PdfViewerNativeModule | undefined;
}

export async function saveGeneratedPdfBase64(
  base64: string,
  fileName: string,
): Promise<GeneratedPdfFile> {
  const pdfViewer = getPdfViewerModule();

  if (!pdfViewer?.savePdfBase64) {
    throw new Error('PDF viewer module is not available');
  }

  return pdfViewer.savePdfBase64(base64, fileName);
}

export async function openGeneratedPdf(file: GeneratedPdfFile) {
  const pdfViewer = getPdfViewerModule();

  if (!pdfViewer) {
    throw new Error('PDF viewer module is not available');
  }

  await pdfViewer.openPdf(file.path);
}

export async function shareGeneratedPdf(file: GeneratedPdfFile) {
  await Share.share({
    title: file.fileName,
    message: file.fileName,
    url: file.uri,
  });
}
