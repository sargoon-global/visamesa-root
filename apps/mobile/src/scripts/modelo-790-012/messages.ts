export type AutomationWebViewError = {title: string; message: string; detail?: string};

export function isModelo790Error(value: unknown): value is {
  __visaMesaAutomationError: true;
  payload: AutomationWebViewError;
} {
  if (!value || typeof value !== 'object') {return false;}
  const message = value as {__visaMesaAutomationError?: boolean; payload?: AutomationWebViewError};
  return message.__visaMesaAutomationError === true &&
    typeof message.payload?.title === 'string' && typeof message.payload.message === 'string';
}

export function isModelo790Pdf(value: unknown): value is {
  __visaMesaModelo790Pdf: true;
  payload: {base64: string; fileName: string};
} {
  if (!value || typeof value !== 'object') {return false;}
  const message = value as {__visaMesaModelo790Pdf?: boolean; payload?: {base64?: string; fileName?: string}};
  return message.__visaMesaModelo790Pdf === true &&
    typeof message.payload?.base64 === 'string' && message.payload.base64.startsWith('JVBERi0') &&
    message.payload.base64.length <= 20_000_000 &&
    typeof message.payload.fileName === 'string' && /^modelo-790-012-\d+\.pdf$/.test(message.payload.fileName);
}
