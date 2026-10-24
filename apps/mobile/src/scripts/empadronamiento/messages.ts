import type {BookingAssistantAppointmentSummary} from '@/features/dashboard/types/UserProgress';

export type EmpadronamientoAppointmentDraft = Partial<
  BookingAssistantAppointmentSummary
> & {
  pdfUrl?: string;
};

type EmpadronamientoSelectionMessage = {
  type: 'empadronamiento-selection';
  payload: EmpadronamientoAppointmentDraft;
};

type EmpadronamientoReviewReadyMessage = {
  type: 'empadronamiento-review-ready';
  payload: EmpadronamientoAppointmentDraft;
};

type EmpadronamientoSubmitStartedMessage = {
  type: 'empadronamiento-submit-started';
};

type EmpadronamientoErrorMessage = {
  type: 'empadronamiento-error';
  payload: {
    title: string;
    message: string;
    detail?: string;
  };
};

type EmpadronamientoBookingCompleteMessage = {
  type: 'empadronamiento-booking-complete';
  payload: EmpadronamientoAppointmentDraft;
};

type EmpadronamientoPdfMessage = {
  __visaMesaEmpadronamientoPdf: true;
  payload: {
    base64: string;
    fileName: string;
  };
};

export type EmpadronamientoWebViewMessage =
  | EmpadronamientoSelectionMessage
  | EmpadronamientoReviewReadyMessage
  | EmpadronamientoSubmitStartedMessage
  | EmpadronamientoBookingCompleteMessage
  | EmpadronamientoErrorMessage;

export function isEmpadronamientoPdf(value: unknown): value is EmpadronamientoPdfMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const message = value as {
    __visaMesaEmpadronamientoPdf?: boolean;
    payload?: {base64?: string; fileName?: string};
  };
  return (
    message.__visaMesaEmpadronamientoPdf === true &&
    typeof message.payload?.base64 === 'string' &&
    message.payload.base64.startsWith('JVBERi0') &&
    message.payload.base64.length <= 20_000_000 &&
    typeof message.payload.fileName === 'string' &&
    /^empadronamiento-cita-\d+\.pdf$/.test(message.payload.fileName)
  );
}

export function isEmpadronamientoMessage(
  value: unknown,
): value is EmpadronamientoWebViewMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const type = (value as {type?: unknown}).type;
  return (
    type === 'empadronamiento-selection' ||
    type === 'empadronamiento-review-ready' ||
    type === 'empadronamiento-submit-started' ||
    type === 'empadronamiento-booking-complete' ||
    type === 'empadronamiento-error'
  );
}
