import {isModelo790Error, isModelo790Pdf} from './messages';

describe('Modelo 790 WebView messages', () => {
  it('accepts only expected PDF payloads', () => {
    const valid = {__visaMesaModelo790Pdf: true, payload: {
      base64: 'JVBERi0xLjQ=', fileName: 'modelo-790-012-1234.pdf',
    }};
    expect(isModelo790Pdf(valid)).toBe(true);
    expect(isModelo790Pdf({...valid, payload: {...valid.payload, fileName: '../evil.pdf'}})).toBe(false);
    expect(isModelo790Pdf({...valid, payload: {...valid.payload, base64: 'not-a-pdf'}})).toBe(false);
    expect(isModelo790Pdf({payload: valid.payload})).toBe(false);
  });

  it('accepts terminal errors only with a title and message', () => {
    expect(isModelo790Error({__visaMesaAutomationError: true, payload: {title: 'Error', message: 'Try again'}})).toBe(true);
    expect(isModelo790Error({__visaMesaAutomationError: true, payload: {title: 'Error'}})).toBe(false);
  });
});
